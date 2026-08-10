import { NextResponse } from "next/server";
import { IdentificationError, identifyFromImage, identifyFromText } from "@/lib/identification";
import { checkScanRateLimit, getClientIdentifier } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id")?.slice(0, 128) || crypto.randomUUID();
  const clientId =
    request.headers.get("x-scrapp-client-id")?.slice(0, 128) || getClientIdentifier(request);
  const limit = await checkScanRateLimit(clientId);
  if (!limit.success) {
    return NextResponse.json(
      {
        error: {
          code: "rate_limited",
          message: "Too many requests. Wait a moment and retry.",
          requestId
        }
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000)))
        }
      }
    );
  }

  try {
    const form = await request.formData();
    const image = form.get("image");
    const description = form.get("text");
    const barcode = form.get("barcode");
    const modes = [
      image instanceof File,
      typeof description === "string" && !!description.trim(),
      typeof barcode === "string" && !!barcode.trim()
    ].filter(Boolean);
    if (modes.length !== 1) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_input",
            message: "Provide exactly one image, description, or barcode.",
            requestId
          }
        },
        { status: 400 }
      );
    }
    if (typeof barcode === "string" && barcode.trim()) {
      return NextResponse.json(
        {
          error: {
            code: "barcode_not_enabled",
            message: "Barcode lookup is not enabled yet. Use a photo or description.",
            requestId
          }
        },
        { status: 501 }
      );
    }

    const result =
      image instanceof File
        ? await identifyFromImage(
            image,
            typeof form.get("context") === "string" ? String(form.get("context")) : undefined,
            requestId
          )
        : await identifyFromText(String(description));
    return NextResponse.json(result, { headers: { "X-Request-Id": requestId } });
  } catch (error) {
    if (error instanceof IdentificationError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, requestId } },
        { status: error.status, headers: { "X-Request-Id": requestId } }
      );
    }
    return NextResponse.json(
      {
        error: {
          code: "identify_failed",
          message: "Identification could not be completed.",
          requestId
        }
      },
      { status: 500, headers: { "X-Request-Id": requestId } }
    );
  }
}
