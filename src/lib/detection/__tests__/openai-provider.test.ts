import type OpenAI from "openai";
import { describe, expect, it, vi } from "vitest";
import { OpenAIResponsesDetectionProvider } from "../providers/openai";

const input = {
  kind: "image" as const,
  bytes: new Uint8Array([1, 2, 3]),
  mimeType: "image/jpeg" as const
};
const context = { requestId: "request-1", signal: new AbortController().signal };

function clientWith(parse: ReturnType<typeof vi.fn>) {
  return { responses: { parse } } as unknown as OpenAI;
}

describe("OpenAIResponsesDetectionProvider", () => {
  it("returns schema-parsed candidates and usage", async () => {
    const parse = vi.fn().mockResolvedValue({
      output_parsed: {
        candidates: [
          {
            id: "can",
            name: "Can",
            material: "metal-can",
            condition: "empty",
            packagingClues: [],
            hazards: [],
            confidence: 0.94
          }
        ],
        uncertainty: ""
      },
      usage: { input_tokens: 12, output_tokens: 8, total_tokens: 20 }
    });
    const provider = new OpenAIResponsesDetectionProvider({
      apiKey: "test",
      model: "gpt-4o-mini",
      client: clientWith(parse)
    });
    const result = await provider.detect(input, context);
    expect(result.candidates[0]?.material).toBe("metal-can");
    expect(result.usage?.totalTokens).toBe(20);
    expect(parse).toHaveBeenCalledOnce();
  });

  it("maps provider rate limits to a retryable public error", async () => {
    const provider = new OpenAIResponsesDetectionProvider({
      apiKey: "test",
      client: clientWith(vi.fn().mockRejectedValue({ status: 429 }))
    });
    await expect(provider.detect(input, context)).rejects.toMatchObject({
      code: "classifier_rate_limited",
      status: 429,
      retryable: true
    });
  });

  it("rejects an empty parsed response", async () => {
    const provider = new OpenAIResponsesDetectionProvider({
      apiKey: "test",
      client: clientWith(vi.fn().mockResolvedValue({ output_parsed: null }))
    });
    await expect(provider.detect(input, context)).rejects.toMatchObject({
      code: "invalid_provider_response",
      status: 502
    });
  });

  it("reports missing configuration without a network request", () => {
    const provider = new OpenAIResponsesDetectionProvider({
      apiKey: "",
      client: clientWith(vi.fn())
    });
    expect(provider.readiness()).toEqual({ ready: false, reason: "OPENAI_API_KEY is missing" });
  });
});
