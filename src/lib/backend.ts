"use server";

import { BaseStates } from "./states";
import type { PredictionResult } from "./types";

type PredictReturnType =
  | [BaseStates.ERROR, null, string]
  | [BaseStates.SUCCESS, PredictionResult];

export async function predict(formData: FormData): Promise<PredictReturnType> {
  const endpoint = process.env.NEXT_PRIVATE_BACKEND_URL;
  const key = process.env.BACKEND_API_KEY;
  if (!key || !endpoint) {
    return [BaseStates.ERROR, null, "The scanner service is unavailable."];
  }

  try {
    const res = await fetch(new URL("/predict", endpoint), {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(60_000)
    });

    if (!res.ok) {
      console.warn("Scrapp prediction request failed with status", res.status);
      const message = res.status === 413
        ? "This photo is too large. Choose a smaller image or describe the item."
        : res.status === 400 || res.status === 415
          ? "The scanner could not read the input. Try a JPEG, PNG, or a description."
          : "The scanner service is unavailable.";
      return [BaseStates.ERROR, null, message];
    }

    const data = await res.json();
    if (!data || (!Array.isArray(data.items) && !Array.isArray(data.detections))) {
      return [BaseStates.ERROR, null, "The scanner returned an unreadable result."];
    }
    return [BaseStates.SUCCESS, data];
  } catch {
    return [BaseStates.ERROR, null, "The scanner could not reach the analysis service."];
  }
}
