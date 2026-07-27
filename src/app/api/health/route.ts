import {NextResponse} from "next/server";

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "unknown",
    version: process.env.npm_package_version ?? "unknown",
    checks: {
      env: {
        hasPlacesKey: !!process.env.GOOGLE_PLACES_API_KEY,
        hasMapsKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        hasBackendUrl: !!process.env.NEXT_PRIVATE_BACKEND_URL,
        hasBackendKey: !!process.env.BACKEND_API_KEY,
        hasUpstash: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
      },
      backend: "unknown"
    }
  };

  // Check backend connectivity
  try {
    const backendUrl = process.env.NEXT_PRIVATE_BACKEND_URL;
    const backendKey = process.env.BACKEND_API_KEY;

    if (backendUrl && backendKey) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${backendUrl}/health`, {
        headers: {Authorization: `Bearer ${backendKey}`},
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      checks.checks.backend = res.ok ? "healthy" : `unhealthy: ${res.status}`;
    } else {
      checks.checks.backend = "not_configured";
    }
  } catch (e) {
    checks.checks.backend = `unreachable: ${e instanceof Error ? e.message : "unknown"}`;
  }

  // Determine overall health
  const requiredEnv =
    checks.checks.env.hasPlacesKey &&
    checks.checks.env.hasMapsKey &&
    checks.checks.env.hasBackendUrl &&
    checks.checks.env.hasBackendKey;

  const healthy = requiredEnv && checks.checks.backend === "healthy";

  return NextResponse.json(checks, {
    status: healthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate"
    }
  });
}
