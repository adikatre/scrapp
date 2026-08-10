import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  type DetectionExecutionContext,
  type ProviderDetectionInput,
  providerDetectionSchema
} from "../contracts";
import { DetectionError } from "../errors";
import { DetectionProvider } from "../provider";

const SYSTEM_PROMPT =
  `Identify only the foreground waste items. Return candidates, material, 
  visible condition, packaging clues, hazards, and confidence. Do not 
  choose a bin, disposal route, facility, or local rule. Do not classify 
  people, animals, or background furniture as waste.`;

export class OpenAIResponsesDetectionProvider extends DetectionProvider {
  readonly id = "openai";
  readonly capabilities = new Set(["image"] as const);
  readonly model: string;
  private readonly apiKey?: string;
  private readonly client: OpenAI;

  constructor(options: { apiKey?: string; model?: string; client?: OpenAI } = {}) {
    super();
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
    this.model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    this.client = options.client ?? new OpenAI({ apiKey: this.apiKey ?? "missing" });
  }

  readiness() {
    return this.apiKey
      ? ({ ready: true } as const)
      : ({ ready: false, reason: "OPENAI_API_KEY is missing" } as const);
  }

  async detect(input: ProviderDetectionInput, context: DetectionExecutionContext) {
    if (!this.readiness().ready) {
      throw new DetectionError(
        "classifier_unavailable",
        "Photo identification is not configured on this deployment.",
        503,
        true
      );
    }

    try {
      const response = await this.client.responses.parse(
        {
          model: this.model,
          temperature: 0.1,
          max_output_tokens: 900,
          input: [
            { role: "system", content: [{ type: "input_text", text: SYSTEM_PROMPT }] },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: input.context?.trim()
                    ? `Identify the item the user means. User context: ${input.context.trim().slice(0, 500)}`
                    : "Identify each plausible foreground item. Keep separate objects as separate candidates."
                },
                {
                  type: "input_image",
                  image_url: `data:${input.mimeType};base64,${Buffer.from(input.bytes).toString("base64")}`,
                  detail: "high"
                }
              ]
            }
          ],
          text: { format: zodTextFormat(providerDetectionSchema, "waste_identification") }
        },
        { signal: context.signal, headers: { "X-Client-Request-Id": context.requestId } }
      );

      if (!response.output_parsed) {
        throw new DetectionError(
          "invalid_provider_response",
          "Photo identification returned an invalid response.",
          502,
          true
        );
      }
      return {
        ...response.output_parsed,
        usage: response.usage
          ? {
              inputTokens: response.usage.input_tokens,
              outputTokens: response.usage.output_tokens,
              totalTokens: response.usage.total_tokens
            }
          : undefined
      };
    } catch (error) {
      if (error instanceof DetectionError) throw error;
      const errorName = error instanceof Error ? error.name : "";
      if (
        (error instanceof DOMException && error.name === "AbortError") ||
        /timeout|abort/i.test(errorName)
      ) {
        throw new DetectionError(
          "classifier_timeout",
          "Photo identification timed out.",
          504,
          true
        );
      }
      const status =
        typeof error === "object" && error && "status" in error ? Number(error.status) : undefined;
      if (status === 429)
        throw new DetectionError(
          "classifier_rate_limited",
          "Photo identification is busy. Wait a moment and try again.",
          429,
          true
        );
      if (status === 401 || status === 403)
        throw new DetectionError(
          "classifier_unavailable",
          "Photo identification is not configured correctly.",
          503,
          true
        );
      throw new DetectionError(
        "classifier_failed",
        "Photo identification could not be completed.",
        502,
        true
      );
    }
  }
}
