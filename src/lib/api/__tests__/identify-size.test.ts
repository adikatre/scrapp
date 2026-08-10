import { expect, it, vi } from "vitest";
import type { DetectionService } from "@/lib/detection/service";
import { createIdentifyHandler } from "../identify-handler";

it("rejects an oversized multipart request before parsing it", async () => {
  const service = { identifyImage: vi.fn(), identifyText: vi.fn() } as unknown as DetectionService;
  const handler = createIdentifyHandler({
    service,
    rateLimiter: {
      limit: async () => ({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60_000 })
    },
    getClientId: () => "test"
  });
  const request = new Request("http://localhost/api/v2/identify", {
    method: "POST",
    body: new FormData(),
    headers: { "content-length": String(7 * 1024 * 1024) }
  });
  const response = await handler(request);
  expect(response.status).toBe(413);
  expect(await response.json()).toMatchObject({ error: { code: "request_too_large" } });
  expect(service.identifyImage).not.toHaveBeenCalled();
});
