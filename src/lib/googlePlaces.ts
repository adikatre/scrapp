"use server";

import {
  buildSearchQuery,
  getCategoryByKey,
  sanitizeSearchQueries,
  type LocationCategoryKey
} from "./locationCategories";
import { getCuratedPlaces } from "./curated";
import { Place, PlaceDetails } from "./types";

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

/** Below this many item-specific hits, backfill with the generic category search */
const MIN_ITEM_RESULTS = 5;

type GooglePlaceResult = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  photos?: { name?: string }[];
};

type GooglePlaceDetailsResult = GooglePlaceResult & {
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
};

function mapPlace(raw: GooglePlaceResult): Place | null {
  if (!raw.id || !raw.location?.latitude || !raw.location?.longitude) {
    return null;
  }

  return {
    id: raw.id,
    name: raw.displayName?.text ?? "Unknown place",
    address: raw.formattedAddress ?? "",
    lat: raw.location.latitude,
    lng: raw.location.longitude,
    googleMapsUri: raw.googleMapsUri,
    photoName: raw.photos?.[0]?.name
  };
}

export async function searchPlaces(input: {
  categoryKey: LocationCategoryKey;
  locationLabel: string;
  lat?: number;
  lng?: number;
  item?: string;
  /** Item-specific Places queries (e.g. from the scan classifier); sanitized here */
  queries?: string[];
}): Promise<{ places: Place[]; error?: string }> {
  // Hand-curated county drop-offs are treated as an extra Places source: they
  // are merged into the returned list so callers render them as ordinary cards.
  const curated = getCuratedPlaces({
    categoryKey: input.categoryKey,
    item: input.item,
    lat: input.lat,
    lng: input.lng,
    locationLabel: input.locationLabel
  });

  if (!PLACES_API_KEY) {
    return {
      places: curated,
      error: curated.length
        ? undefined
        : "Google Places API key is not configured. Add GOOGLE_PLACES_API_KEY to .env.local"
    };
  }

  const category = getCategoryByKey(input.categoryKey);
  if (!category?.searchable) {
    return { places: curated, error: undefined };
  }

  const hasCoords = input.lat != null && input.lng != null;
  // With real coordinates, locality comes from locationBias; "near <label>" text
  // would anchor results to the label's geocode (or be junk for "Your location").
  const baseQuery = buildSearchQuery(
    category,
    hasCoords ? null : input.locationLabel,
    input.item
  );

  const itemQueries = sanitizeSearchQueries(input.queries)
    .map((q) => (hasCoords ? q : `${q} near ${input.locationLabel}`))
    .filter((q) => q !== baseQuery);

  const [itemResults, baseResult] = await Promise.all([
    Promise.all(
      itemQueries.map((textQuery) =>
        runTextSearch(textQuery, input.lat, input.lng)
      )
    ),
    runTextSearch(baseQuery, input.lat, input.lng)
  ]);

  const seen = new Set<string>();
  const merged: Place[] = [...curated];
  for (const place of curated) seen.add(place.id);

  // Item-specific (LLM-grounded) results come first: they target the exact
  // scanned item, so they beat the generic category query in relevance.
  for (const result of itemResults) {
    for (const place of result.places) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      merged.push(place);
    }
  }

  // Generic category results only backfill when item queries were sparse or
  // absent; text search is fuzzy, so drop adjacent-but-wrong business types
  // (e.g. scrap metal yards for "household hazardous waste").
  const itemResultCount = merged.length - curated.length;
  if (itemQueries.length === 0 || itemResultCount < MIN_ITEM_RESULTS) {
    for (const place of baseResult.places) {
      if (seen.has(place.id)) continue;
      if (category.excludeResultPattern?.test(place.name)) continue;
      seen.add(place.id);
      merged.push(place);
    }
  }

  // Only surface an error when every query failed and nothing else was found.
  const firstError =
    itemResults.find((r) => r.error)?.error ?? baseResult.error;
  if (merged.length === 0 && firstError) {
    return { places: [], error: firstError };
  }
  return { places: merged };
}

async function runTextSearch(
  textQuery: string,
  lat?: number,
  lng?: number
): Promise<{ places: Place[]; error?: string }> {
  const body: Record<string, unknown> = {
    textQuery,
    pageSize: 20
  };

  if (lat != null && lng != null) {
    body.locationBias = {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 25000
      }
    };
    // Return the nearest matches instead of the globally "most relevant"
    // ones, which can otherwise be miles outside the biased circle.
    body.rankPreference = "DISTANCE";
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": PLACES_API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.photos"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("[googlePlaces] search failed:", res.status, errText);
      try {
        const errJson = JSON.parse(errText) as {
          error?: { message?: string };
        };
        const googleMsg = errJson.error?.message;
        if (googleMsg) {
          if (
            googleMsg.includes("Places API (New)") &&
            googleMsg.toLowerCase().includes("disabled")
          ) {
            return {
              places: [],
              error:
                "Places API (New) is not enabled for this key's Google Cloud project. Enable it in Google Cloud Console (APIs & Services → Library → Places API (New)), wait a few minutes, then refresh."
            };
          }
          return { places: [], error: googleMsg };
        }
      } catch {
        // fall through to generic message
      }
      return {
        places: [],
        error: `Places search failed (${res.status}). Check your API key and billing.`
      };
    }

    const data = (await res.json()) as { places?: GooglePlaceResult[] };
    const places = (data.places ?? [])
      .map(mapPlace)
      .filter((p): p is Place => p !== null);

    return { places };
  } catch (e) {
    console.warn("[googlePlaces] search error:", e);
    return { places: [], error: "Failed to connect to Google Places API." };
  }
}

export async function getPlaceDetails(
  placeId: string
): Promise<{ details: PlaceDetails | null; error?: string }> {
  if (!PLACES_API_KEY) {
    return {
      details: null,
      error: "Google Places API key is not configured."
    };
  }

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": PLACES_API_KEY,
          "X-Goog-FieldMask":
            "id,displayName,formattedAddress,location,googleMapsUri,nationalPhoneNumber,websiteUri,rating,regularOpeningHours"
        }
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.warn("[googlePlaces] details failed:", res.status, errText);
      return { details: null, error: "Failed to load place details." };
    }

    const raw = (await res.json()) as GooglePlaceDetailsResult;
    const base = mapPlace(raw);
    if (!base) {
      return { details: null, error: "Invalid place data." };
    }

    return {
      details: {
        ...base,
        phone: raw.nationalPhoneNumber,
        website: raw.websiteUri,
        rating: raw.rating,
        openNow: raw.regularOpeningHours?.openNow,
        weekdayDescriptions: raw.regularOpeningHours?.weekdayDescriptions
      }
    };
  } catch (e) {
    console.warn("[googlePlaces] details error:", e);
    return { details: null, error: "Failed to connect to Google Places API." };
  }
}
