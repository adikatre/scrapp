import "server-only";

import { z } from "zod";
import { candidateFromRule, searchMaterials } from "@/lib/rules/engine";
import type { IdentificationCandidate } from "@/lib/rules/types";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const candidateSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  material: z.string().min(1).max(120),
  condition: z.string().max(160),
  packagingClues: z.array(z.string().max(120)).max(6),
  hazards: z.array(z.string().max(120)).max(6),
  confidence: z.number().min(0).max(1)
});

const identificationSchema = z.object({
  candidates: z.array(candidateSchema).max(8),
  uncertainty: z.string().max(300)
});

export type IdentificationResult = {
  candidates: IdentificationCandidate[];
  uncertainty: string;
  requiresChoice: boolean;
  model: string;
  durationMs: number;
  requestId: string;
};

export class IdentificationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

function isSupportedImage(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png")
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (type === "image/webp")
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  return false;
}

function requiresChoice(candidates: IdentificationCandidate[]) {
  if (candidates.length !== 1) return candidates.length > 1;
  return candidates[0].confidence < 0.78;
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const response = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  if (response.output_text) return response.output_text;
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  return null;
}

export async function identifyFromText(text: string): Promise<IdentificationResult> {
  const started = Date.now();
  const matches = searchMaterials(text.trim(), 5);
  const candidates = matches.map((rule, index) =>
    candidateFromRule(rule, index === 0 ? 0.99 : 0.82)
  );
  return {
    candidates,
    uncertainty: candidates.length
      ? ""
      : "No verified San Diego material matched that description.",
    requiresChoice: candidates.length > 1,
    model: "material-index-v1",
    durationMs: Date.now() - started,
    requestId: crypto.randomUUID()
  };
}

export async function identifyFromImage(
  file: File,
  context?: string,
  requestId = crypto.randomUUID()
): Promise<IdentificationResult> {
  const started = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new IdentificationError(
      "classifier_unavailable",
      "Photo identification is not configured on this deployment.",
      503
    );
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new IdentificationError("unsupported_image", "Upload a JPEG, PNG, or WebP image.", 415);
  }
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    throw new IdentificationError(
      "invalid_image_size",
      "The image must be smaller than 5 MB.",
      413
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isSupportedImage(bytes, file.type)) {
    throw new IdentificationError(
      "invalid_image",
      "The file signature does not match its image type.",
      400
    );
  }

  const dataUrl = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Client-Request-Id": requestId
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.1,
      max_output_tokens: 900,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Identify only the foreground waste items. Return candidates, material, visible condition, packaging clues, hazards, and confidence. Do not choose a bin, disposal route, facility, or local rule. Do not classify people, animals, or background furniture as waste."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: context?.trim()
                ? `Identify the item the user means. User context: ${context.trim().slice(0, 500)}`
                : "Identify each plausible foreground item. Keep separate objects as separate candidates."
            },
            { type: "input_image", image_url: dataUrl, detail: "high" }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "waste_identification",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["candidates", "uncertainty"],
            properties: {
              candidates: {
                type: "array",
                maxItems: 8,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "id",
                    "name",
                    "material",
                    "condition",
                    "packagingClues",
                    "hazards",
                    "confidence"
                  ],
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    material: { type: "string" },
                    condition: { type: "string" },
                    packagingClues: { type: "array", items: { type: "string" } },
                    hazards: { type: "array", items: { type: "string" } },
                    confidence: { type: "number", minimum: 0, maximum: 1 }
                  }
                }
              },
              uncertainty: { type: "string" }
            }
          }
        }
      }
    }),
    signal: AbortSignal.timeout(20_000),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new IdentificationError(
      response.status === 429 ? "classifier_rate_limited" : "classifier_failed",
      response.status === 429
        ? "Photo identification is busy. Wait a moment and try again."
        : "Photo identification could not be completed.",
      response.status === 429 ? 429 : 502
    );
  }

  const outputText = extractOutputText(await response.json());
  if (!outputText) {
    throw new IdentificationError("empty_identification", "No item candidates were returned.", 422);
  }

  const parsed = identificationSchema.safeParse(JSON.parse(outputText));
  if (!parsed.success || parsed.data.candidates.length === 0) {
    throw new IdentificationError(
      "unreadable_identification",
      "Scrapp could not identify a clear disposal item in that photo.",
      422
    );
  }

  const candidates = [...parsed.data.candidates].sort((a, b) => b.confidence - a.confidence);
  return {
    candidates,
    uncertainty: parsed.data.uncertainty,
    requiresChoice: requiresChoice(candidates),
    model: MODEL,
    durationMs: Date.now() - started,
    requestId
  };
}
