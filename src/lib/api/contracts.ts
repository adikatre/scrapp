import { z } from "zod";
import { detectionCandidateSchema } from "@/lib/detection/contracts";

export const decideRequestSchema = z.object({
  candidate: detectionCandidateSchema,
  jurisdictionId: z.string().min(1).max(120),
  serviceProfileId: z.string().min(1).max(120)
});

export type ApiErrorBody = {
  error: { code: string; message: string; requestId: string; retryable: boolean };
};

export function apiError(
  code: string,
  message: string,
  requestId: string,
  retryable = false
): ApiErrorBody {
  return { error: { code, message, requestId, retryable } };
}
