import { z } from "zod";

export const detectionCandidateSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  material: z.string().min(1).max(120),
  condition: z.string().max(160),
  packagingClues: z.array(z.string().max(120)).max(6),
  hazards: z.array(z.string().max(120)).max(6),
  confidence: z.number().min(0).max(1)
});

export const providerDetectionSchema = z.object({
  candidates: z.array(detectionCandidateSchema).max(8),
  uncertainty: z.string().max(300)
});

export type DetectionCandidate = z.infer<typeof detectionCandidateSchema>;
export type DetectionMode = "image" | "text" | "barcode";

export type ProviderDetectionInput = {
  kind: "image";
  bytes: Uint8Array;
  mimeType: "image/jpeg";
  context?: string;
};

export type DetectionExecutionContext = {
  requestId: string;
  signal: AbortSignal;
};

export type ProviderDetectionOutput = z.infer<typeof providerDetectionSchema> & {
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
};

export type DetectionResult = {
  schemaVersion: "2.1";
  candidates: DetectionCandidate[];
  uncertainty: string;
  requiresChoice: boolean;
  provider: string;
  model: string;
  durationMs: number;
  requestId: string;
};
