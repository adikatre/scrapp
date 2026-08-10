import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? "unknown",
      version: process.env.npm_package_version ?? "unknown"
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
