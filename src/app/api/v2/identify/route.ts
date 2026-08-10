import { createIdentifyHandler } from "@/lib/api/identify-handler";
import { getDetectionService } from "@/lib/detection/system";
import { checkScanRateLimit, getClientIdentifier } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

export const POST = createIdentifyHandler({
  service: getDetectionService(),
  rateLimiter: { limit: checkScanRateLimit },
  getClientId: getClientIdentifier
});
