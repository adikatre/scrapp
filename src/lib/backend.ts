"use server";

import { BaseStates } from "./states";
import { PredictionResult } from "./types";

const BACKEND_URL = process.env.NEXT_PRIVATE_BACKEND_URL || "";

if (!BACKEND_URL) throw new Error("[backend.ts] backend url not defined");

type PredictReturnType =
  | [BaseStates.ERROR, null]
  | [BaseStates.SUCCESS, PredictionResult];

export async function predict(formData: FormData): Promise<PredictReturnType> {
  const url = new URL(BACKEND_URL);
  url.pathname = "/predict";

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      console.warn(`[backend.ts] predict failed with status ${res.status}`);
      return [BaseStates.ERROR, null];
    }

    const data = (await res.json()) as PredictionResult;
    return [BaseStates.SUCCESS, data];
  } catch (e) {
    console.warn(e);

    return [BaseStates.ERROR, null];
  }
}
