"use server";

import { BaseStates } from "./states";
import { PredictionResult } from "./types";
import { validateImageFile, checkScanRateLimit } from "./rate-limit";

const BACKEND_URL = process.env.NEXT_PRIVATE_BACKEND_URL || "";
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || "";

if (!BACKEND_URL) throw new Error("[backend.ts] backend url not defined");
if (!BACKEND_API_KEY)
	throw new Error("[backend.ts] backend api key not defined");

type PredictReturnType =
	| [BaseStates.ERROR, null, Record<string, string>?]
	| [BaseStates.SUCCESS, PredictionResult, Record<string, string>?];

/**
 * Extract client identifier from form data
 * The client component should include this in the FormData
 */
function getClientId(formData: FormData): string {
	const clientId = formData.get("clientId") as string | null;
	if (clientId) return clientId;

	// Fallback: use a generic identifier
	// In production, you'd want to use a proper fingerprint
	return "anonymous";
}

export async function predict(formData: FormData): Promise<PredictReturnType> {
	// Rate limiting
	const clientId = getClientId(formData);
	const rateLimitResult = await checkScanRateLimit(clientId);

	if (!rateLimitResult.success) {
		console.warn("[backend.ts] Rate limit exceeded for client:", clientId);
		return [
			BaseStates.ERROR,
			null,
			{
				"X-RateLimit-Limit": rateLimitResult.limit.toString(),
				"X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
				"X-RateLimit-Reset": Math.ceil(rateLimitResult.reset / 1000).toString(),
				"Retry-After": Math.ceil(
					(rateLimitResult.reset - Date.now()) / 1000,
				).toString(),
			},
		];
	}

	// File validation
	const file = formData.get("file") as File | null;
	if (!file) {
		return [
			BaseStates.ERROR,
			null,
			{
				"X-RateLimit-Limit": rateLimitResult.limit.toString(),
				"X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
				"X-RateLimit-Reset": Math.ceil(rateLimitResult.reset / 1000).toString(),
			},
		];
	}

	const validationError = validateImageFile(file);
	if (validationError) {
		console.warn("[backend.ts] File validation failed:", validationError);
		return [
			BaseStates.ERROR,
			null,
			{
				"X-RateLimit-Limit": rateLimitResult.limit.toString(),
				"X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
				"X-RateLimit-Reset": Math.ceil(rateLimitResult.reset / 1000).toString(),
			},
		];
	}

	const url = new URL(BACKEND_URL);
	url.pathname = "/predict";

	try {
		const res = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${BACKEND_API_KEY}`,
			},
			body: formData,
		});

		if (!res.ok) {
			console.warn(`[backend.ts] predict failed with status ${res.status}`);
			return [
				BaseStates.ERROR,
				null,
				{
					"X-RateLimit-Limit": rateLimitResult.limit.toString(),
					"X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
					"X-RateLimit-Reset": Math.ceil(
						rateLimitResult.reset / 1000,
					).toString(),
				},
			];
		}

		const data = (await res.json()) as PredictionResult;
		return [
			BaseStates.SUCCESS,
			data,
			{
				"X-RateLimit-Limit": rateLimitResult.limit.toString(),
				"X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
				"X-RateLimit-Reset": Math.ceil(rateLimitResult.reset / 1000).toString(),
			},
		];
	} catch (e) {
		console.warn("[backend.ts] predict error:", e);
		return [
			BaseStates.ERROR,
			null,
			{
				"X-RateLimit-Limit": rateLimitResult.limit.toString(),
				"X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
				"X-RateLimit-Reset": Math.ceil(rateLimitResult.reset / 1000).toString(),
			},
		];
	}
}
