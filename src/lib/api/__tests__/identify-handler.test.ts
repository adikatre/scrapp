import { describe, expect, it, vi } from "vitest";
import type { DetectionService } from "@/lib/detection/service";
import { createIdentifyHandler } from "../identify-handler";

function dependencies() {
  return {
    service: {
      identifyText: vi.fn().mockResolvedValue({
        schemaVersion: "2.1",
        candidates: [],
        uncertainty: "No match",
        requiresChoice: false,
        provider: "material-catalog",
        model: "material-catalog-v1",
        durationMs: 1,
        requestId: "request"
      }),
      identifyImage: vi.fn()
    } as unknown as DetectionService,
    rateLimiter: {
      limit: vi
        .fn()
        .mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60_000 })
    },
    getClientId: () => "test-client"
  };
}

describe("identify handler", () => {
  it("accepts one text mode and preserves the v2 response", async () => {
    const deps = dependencies();
    const form = new FormData();
    form.set("text", "charger");
    const response = await createIdentifyHandler(deps)(
      new Request("http://localhost/api/v2/identify", {
        method: "POST",
        body: form,
        headers: { "x-request-id": "request" }
      })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      schemaVersion: "2.1",
      provider: "material-catalog"
    });
    expect(deps.service.identifyText).toHaveBeenCalledWith("charger", "request");
  });

  it("rejects conflicting input modes", async () => {
    const deps = dependencies();
    const form = new FormData();
    form.set("text", "charger");
    form.set("barcode", "123");
    const response = await createIdentifyHandler(deps)(
      new Request("http://localhost/api/v2/identify", { method: "POST", body: form })
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "invalid_input", retryable: false }
    });
  });

  it("returns retry metadata for rate limits", async () => {
    const deps = dependencies();
    deps.rateLimiter.limit.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 10_000
    });
    const response = await createIdentifyHandler(deps)(
      new Request("http://localhost/api/v2/identify", { method: "POST", body: new FormData() })
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBeTruthy();
    expect(await response.json()).toMatchObject({
      error: { code: "rate_limited", retryable: true }
    });
  });
});
