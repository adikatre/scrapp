import type OpenAI from "openai";
import { expect, it, vi } from "vitest";
import { OpenAIResponsesDetectionProvider } from "../providers/openai";

it("maps SDK timeout errors to a retryable gateway timeout", async () => {
  const timeout = Object.assign(new Error("timed out"), { name: "APIConnectionTimeoutError" });
  const client = { responses: { parse: vi.fn().mockRejectedValue(timeout) } } as unknown as OpenAI;
  const provider = new OpenAIResponsesDetectionProvider({ apiKey: "test", client });
  await expect(
    provider.detect(
      { kind: "image", bytes: new Uint8Array([1]), mimeType: "image/jpeg" },
      { requestId: "timeout", signal: new AbortController().signal }
    )
  ).rejects.toMatchObject({ code: "classifier_timeout", status: 504, retryable: true });
});
