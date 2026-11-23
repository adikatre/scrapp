import { haversineDistance } from "../geo";
import type { Place } from "../types";
import { sanDiegoBatteryProgram } from "./sanDiegoBatteries";
import {
  socalCellphoneProgram,
  socalEbikeBatteryProgram,
  socalHouseholdBatteryProgram
} from "./socalBatteries";
import type { CuratedMatchInput, CuratedProvider } from "./types";

/**
 * Registry of curated drop-off programs. To add one, create a provider module
 * (copy ./sanDiegoBatteries as a template) and append it here — the search
 * pipeline picks it up automatically via `getCuratedPlaces`.
 */
export const CURATED_PROVIDERS: CuratedProvider[] = [
  sanDiegoBatteryProgram,
  socalHouseholdBatteryProgram,
  socalEbikeBatteryProgram,
  socalCellphoneProgram
];

/**
 * A matched provider's places, reduced to the `nearestLimit` closest sites when
 * the provider sets one and the search has real coordinates. Keeps dense
 * programs (hundreds of sites) from swamping the result list and map.
 */
function selectPlaces(provider: CuratedProvider, input: CuratedMatchInput): Place[] {
  const { nearestLimit } = provider;
  const { lat, lng } = input;
  if (lat == null || lng == null) {
    // Without a geocode, match a city or ZIP in the program's addresses.
    // A regional provider can include sites hundreds of miles apart.
    const [locality, region] = (input.locationLabel ?? "").toLowerCase().split(",").map(part => part.trim());
    if (!locality || (region && !/^(?:ca|california)(?: \d{5})?$/.test(region))) return [];
    const zip = /^\d{5}$/.test(locality);
    const matches = provider.places.filter(place => {
      const city = place.address.split(",")[1]?.trim().toLowerCase();
      return city === locality || (zip && place.address.endsWith(" " + locality));
    });
    return matches.slice(0, nearestLimit ?? matches.length);
  }
  if (nearestLimit == null) return provider.places;
  return [...provider.places]
    .sort(
      (a, b) =>
        haversineDistance(lat, lng, a.lat, a.lng) -
        haversineDistance(lat, lng, b.lat, b.lng)
    )
    .slice(0, nearestLimit);
}

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
    for (const place of selectPlaces(provider, input)) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      places.push(place);
    }
  }

  return places;
}

export type { CuratedMatchInput, CuratedProvider } from "./types";
