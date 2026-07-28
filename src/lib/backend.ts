"use server";

import { checkScanRateLimit, validateImageFile } from "./rateLimit";
import { BaseStates } from "./states";
import type { PredictionResult } from "./types";

const BACKEND_URL = process.env.NEXT_PRIVATE_BACKEND_URL || "";
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || "";

if (!BACKEND_URL) throw new Error("[backend.ts] backend url not defined");
if (!BACKEND_API_KEY) throw new Error("[backend.ts] backend api key not defined");

type PredictReturnType =
  | [typeof BaseStates.ERROR, null, Record<string, string>?]
  | [typeof BaseStates.SUCCESS, PredictionResult, Record<string, string>?];

function rateLimitHeaders(rl: { limit: number; remaining: number; reset: number }) {
  return {
    "X-RateLimit-Limit": rl.limit.toString(),
    "X-RateLimit-Remaining": rl.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(rl.reset / 1000).toString()
  };
}

function getClientId(formData: FormData): string {
  const clientId = formData.get("clientId");
  if (typeof clientId === "string" && clientId) return clientId;
  return "anonymous";
}

export async function predict(formData: FormData): Promise<PredictReturnType> {
  const clientId = getClientId(formData);
  const rl = await checkScanRateLimit(clientId);

  if (!rl.success) {
    const retryAfter = Math.max(0, Math.ceil((rl.reset - Date.now()) / 1000)).toString();
    return [BaseStates.ERROR, null, { ...rateLimitHeaders(rl), "Retry-After": retryAfter }];
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return [BaseStates.ERROR, null, rateLimitHeaders(rl)];
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return [BaseStates.ERROR, null, rateLimitHeaders(rl)];
  }

  const url = new URL(BACKEND_URL);
  url.pathname = "/predict";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${BACKEND_API_KEY}` },
      body: formData
    });

    if (!res.ok) {
      return [BaseStates.ERROR, null, rateLimitHeaders(rl)];
    }

    const data = (await res.json()) as PredictionResult;
    return [BaseStates.SUCCESS, data, rateLimitHeaders(rl)];
  } catch {
    return [BaseStates.ERROR, null, rateLimitHeaders(rl)];
  }
}
