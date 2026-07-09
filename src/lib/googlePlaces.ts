"use server";

import {
  buildSearchQuery,
  getCategoryByKey,
  type LocationCategoryKey
} from "./locationCategories";
import { Place, PlaceDetails } from "./types";

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

type GooglePlaceResult = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
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
    googleMapsUri: raw.googleMapsUri
  };
}

export async function searchPlaces(input: {
  categoryKey: LocationCategoryKey;
  locationLabel: string;
  lat?: number;
  lng?: number;
}): Promise<{ places: Place[]; error?: string }> {
  if (!PLACES_API_KEY) {
    return {
      places: [],
      error:
        "Google Places API key is not configured. Add GOOGLE_PLACES_API_KEY to .env.local"
    };
  }

  const category = getCategoryByKey(input.categoryKey);
  if (!category?.searchable) {
    return { places: [], error: "This category does not have physical locations." };
  }

  const textQuery = buildSearchQuery(category, input.locationLabel);

  const body: Record<string, unknown> = {
    textQuery,
    pageSize: 20
  };

  if (input.lat != null && input.lng != null) {
    body.locationBias = {
      circle: {
        center: { latitude: input.lat, longitude: input.lng },
        radius: 25000
      }
    };
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": PLACES_API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri"
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
