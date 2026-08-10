import { NextResponse } from "next/server";
import { DetectionError } from "@/lib/detection/errors";
import { MAX_IMAGE_BYTES } from "@/lib/detection/image";
import type { DetectionService } from "@/lib/detection/service";
import { apiError } from "./contracts";
import { getRequestId, requestIdHeaders } from "./request";

type RateLimitResult = { success: boolean; limit: number; remaining: number; reset: number };

export interface RateLimiter {
  limit(key: string): Promise<RateLimitResult>;
}

const MAX_MULTIPART_BYTES = MAX_IMAGE_BYTES + 1024 * 1024;

function isFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.arrayBuffer === "function" &&
    typeof value.type === "string"
  );
}

function limitHeaders(limit: RateLimitResult, requestId: string) {
  return {
    ...requestIdHeaders(requestId),
    "X-RateLimit-Limit": String(limit.limit),
    "X-RateLimit-Remaining": String(limit.remaining),
    "X-RateLimit-Reset": String(Math.ceil(limit.reset / 1000))
  };
}

export function createIdentifyHandler(dependencies: {
  service: DetectionService;
  rateLimiter: RateLimiter;
  getClientId: (request: Request) => string;
}) {
  return async function identify(request: Request) {
    const requestId = getRequestId(request);
    const clientId =
      request.headers.get("x-scrapp-client-id")?.slice(0, 128) || dependencies.getClientId(request);
    const limit = await dependencies.rateLimiter.limit(clientId);
    const headers = limitHeaders(limit, requestId);
    if (!limit.success) {
      return NextResponse.json(
        apiError("rate_limited", "Too many requests. Wait a moment and retry.", requestId, true),
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000)))
          }
        }
      );
    }

    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
      return NextResponse.json(
        apiError(
          "request_too_large",
          "The upload request is too large. Choose an image smaller than 5 MB.",
          requestId
        ),
        { status: 413, headers }
      );
    }

    try {
      const form = await request.formData();
      const image = form.get("image");
      const text = form.get("text");
      const barcode = form.get("barcode");
      const modes = [
        isFile(image),
        typeof text === "string" && Boolean(text.trim()),
        typeof barcode === "string" && Boolean(barcode.trim())
      ].filter(Boolean);
      if (modes.length !== 1) {
        return NextResponse.json(
          apiError(
            "invalid_input",
            "Provide exactly one image, description, or barcode.",
            requestId
          ),
          { status: 400, headers }
        );
      }
      if (typeof barcode === "string" && barcode.trim()) {
        return NextResponse.json(
          apiError(
            "barcode_not_enabled",
            "Barcode lookup is not enabled yet. Use a photo or description.",
            requestId
          ),
          { status: 501, headers }
        );
      }
      const result = isFile(image)
        ? await dependencies.service.identifyImage(image, {
            context:
              typeof form.get("context") === "string" ? String(form.get("context")) : undefined,
            requestId
          })
        : await dependencies.service.identifyText(String(text), requestId);
      return NextResponse.json(result, { headers });
    } catch (error) {
      if (error instanceof DetectionError) {
        return NextResponse.json(apiError(error.code, error.message, requestId, error.retryable), {
          status: error.status,
          headers
        });
      }
      // biome-ignore lint/suspicious/noConsole: request-scoped diagnostics exclude private input.
      console.error(
        JSON.stringify({
          event: "identify.failed",
          requestId,
          error: error instanceof Error ? error.name : "unknown"
        })
      );
      return NextResponse.json(
        apiError("identify_failed", "Identification could not be completed.", requestId, true),
        { status: 500, headers }
      );
    }
  };
}
