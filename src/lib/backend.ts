"use server";

import { identifyFromImage, identifyFromText } from "@/lib/identification";
import { checkScanRateLimit, validateImageFile } from "@/lib/rateLimit";
import { resolveDisposalDecision } from "@/lib/rules/engine";
import type { DisposalDecision, IdentificationCandidate } from "@/lib/rules/types";
import { BaseStates } from "@/lib/states";
import type { PredictionResult } from "@/lib/types";

type PredictReturnType =
  | [typeof BaseStates.ERROR, null, Record<string, string>?]
  | [typeof BaseStates.SUCCESS, PredictionResult, Record<string, string>?];

function rateLimitHeaders(rl: { limit: number; remaining: number; reset: number }) {
  return {
    "X-RateLimit-Limit": String(rl.limit),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rl.reset / 1000))
  };
}

function getClientId(formData: FormData) {
  const clientId = formData.get("clientId");
  return typeof clientId === "string" && clientId ? clientId : crypto.randomUUID();
}

/**
 * Compatibility adapter for callers that still expect the original PredictionResult.
 * Identification and local policy now run inside Next.js; this no longer calls Flask.
 */
export async function decideCandidate(
  candidate: IdentificationCandidate,
  jurisdictionId?: string,
  serviceProfileId?: string
): Promise<DisposalDecision | null> {
  return resolveDisposalDecision({ candidate, jurisdictionId, serviceProfileId });
}

export async function predict(formData: FormData): Promise<PredictReturnType> {
  const limit = await checkScanRateLimit(getClientId(formData));
  if (!limit.success) {
    return [
      BaseStates.ERROR,
      null,
      {
        ...rateLimitHeaders(limit),
        "Retry-After": String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000)))
      }
    ];
  }

  try {
    const file = formData.get("file");
    const description = formData.get("text");
    const identification =
      file instanceof File
        ? await (async () => {
            const validationError = validateImageFile(file);
            if (validationError) throw new Error(validationError);
            return identifyFromImage(
              file,
              typeof description === "string" ? description : undefined
            );
          })()
        : typeof description === "string" && description.trim()
          ? await identifyFromText(description)
          : null;

    const candidate = identification?.candidates[0];
    if (!candidate) return [BaseStates.ERROR, null, rateLimitHeaders(limit)];

    if (identification.requiresChoice) {
      return [
        BaseStates.SUCCESS,
        {
          objects: identification.candidates.map((item) => item.name),
          bin_totals: {},
          detections: [],
          items: identification.candidates.map((item) => ({
            name: item.name,
            material: item.material,
            route: "Needs confirmation",
            confidence: item.confidence,
            caveats: identification.uncertainty
          })),
          classifier: {
            model: identification.model,
            source: "nextjs-identify-v1",
            fallback_used: false
          },
          identificationCandidates: identification.candidates,
          requiresChoice: true
        },
        rateLimitHeaders(limit)
      ];
    }

    const decision = resolveDisposalDecision({
      candidate,
      jurisdictionId:
        typeof formData.get("jurisdictionId") === "string"
          ? String(formData.get("jurisdictionId"))
          : undefined,
      serviceProfileId:
        typeof formData.get("serviceProfileId") === "string"
          ? String(formData.get("serviceProfileId"))
          : undefined
    });
    if (!decision) return [BaseStates.ERROR, null, rateLimitHeaders(limit)];

    const result: PredictionResult = {
      objects: [candidate.name],
      bin_totals: { [decision.bin]: 1 },
      detections: [],
      text: [decision.instruction, ...decision.preparation].join("\n"),
      items: [
        {
          name: candidate.name,
          material: candidate.material,
          route: decision.route,
          bin: decision.bin,
          confidence: candidate.confidence,
          caveats: decision.exceptions.join(" "),
          search_queries: decision.searchQueries
        }
      ],
      classifier: {
        model: identification.model,
        source: "nextjs-identify-plus-rules-v1",
        fallback_used: false
      },
      decision
    };
    return [BaseStates.SUCCESS, result, rateLimitHeaders(limit)];
  } catch {
    return [BaseStates.ERROR, null, rateLimitHeaders(limit)];
  }
}
