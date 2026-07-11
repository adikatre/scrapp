import { NextRequest, NextResponse } from "next/server";

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

/** Google Places photo resource: places/{place_id}/photos/{photo_reference} */
const PHOTO_NAME_PATTERN = /^places\/[\w-]+\/photos\/[\w-]+$/;

const MIN_WIDTH = 48;
const MAX_WIDTH = 640;
const DEFAULT_WIDTH = 128;

/**
 * Redirects to the googleusercontent URL for a Places photo. Proxying keeps
 * GOOGLE_PLACES_API_KEY server-side; the browser then loads the image
 * directly from Google's CDN (no key in the final URL).
 */
export async function GET(req: NextRequest) {
  if (!PLACES_API_KEY) {
    return new NextResponse("Places API key not configured", { status: 503 });
  }

  const name = req.nextUrl.searchParams.get("name") ?? "";
  if (!PHOTO_NAME_PATTERN.test(name)) {
    return new NextResponse("Invalid photo name", { status: 400 });
  }

  const requestedWidth = Number(req.nextUrl.searchParams.get("w"));
  const width = Number.isFinite(requestedWidth)
    ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(requestedWidth)))
    : DEFAULT_WIDTH;

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${width}&skipHttpRedirect=true&key=${PLACES_API_KEY}`,
      // Photo URIs are stable; let Next cache the lookup server-side.
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
      return new NextResponse("Photo not found", { status: 404 });
    }

    const data = (await res.json()) as { photoUri?: string };
    if (!data.photoUri) {
      return new NextResponse("Photo not found", { status: 404 });
    }

    return NextResponse.redirect(data.photoUri, {
      status: 302,
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800"
      }
    });
  } catch {
    return new NextResponse("Failed to load photo", { status: 502 });
  }
}
