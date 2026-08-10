import { NextResponse } from "next/server";
import { getDetectionService } from "@/lib/detection/system";
import { validateRuleCatalog } from "@/lib/rules/catalog";

export async function GET() {
  const detector = getDetectionService();
  const provider = detector.readiness;
  const catalogErrors = validateRuleCatalog();
  const ready = provider.ready && catalogErrors.length === 0;
  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      checks: {
        detection: {
          ...detector.providerMetadata,
          ready: provider.ready,
          ...(provider.ready ? {} : { reason: provider.reason })
        },
        rules: { ready: catalogErrors.length === 0, errors: catalogErrors }
      }
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
    }
  );
}
