import type { Place } from "../types";
import { sanDiegoBatteryProgram } from "./sanDiegoBatteries";
import type { CuratedMatchInput, CuratedProvider } from "./types";

/**
 * Registry of curated drop-off programs. To add one, create a provider module
 * (copy ./sanDiegoBatteries as a template) and append it here — the search
 * pipeline picks it up automatically via `getCuratedPlaces`.
 */
export const CURATED_PROVIDERS: CuratedProvider[] = [sanDiegoBatteryProgram];

/**
 * Curated places from every registered program that matches the current search,
 * de-duplicated by id. Returned entries carry `curated: true` so callers render
 * them as ordinary result cards/markers.
 */
export function getCuratedPlaces(input: CuratedMatchInput): Place[] {
  const seen = new Set<string>();
  const places: Place[] = [];

  for (const provider of CURATED_PROVIDERS) {
    if (!provider.matches(input)) continue;
    for (const place of provider.places) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      places.push(place);
    }
  }

  return places;
}

export type { CuratedMatchInput, CuratedProvider } from "./types";
