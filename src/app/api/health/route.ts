import { NextResponse } from "next/server";

export async function GET() {
  const openaiConfigured = !!process.env.OPENAI_API_KEY;
  const rollbackConfigured = !!(
    process.env.NEXT_PRIVATE_BACKEND_URL && process.env.BACKEND_API_KEY
  );
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "unknown",
    version: process.env.npm_package_version ?? "unknown",
    classifier: {
      service: "nextjs",
      configured: openaiConfigured,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini"
    },
    rules: {
      engine: "typescript",
      jurisdiction: "us-ca-san-diego"
    },
    optionalServices: {
      places: !!process.env.GOOGLE_PLACES_API_KEY,
      maps: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      distributedRateLimit: !!(
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ),
      flaskRollback: rollbackConfigured
    }
  };

  return NextResponse.json(checks, {
    status: openaiConfigured ? 200 : 503,
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
  });
}
