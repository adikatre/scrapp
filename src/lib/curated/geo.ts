import { haversineDistance } from "../geo";
import type { Place } from "../types";

/** A rectangular lat/lng region a curated program can be gated to. */
export type GeoBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

/** True when the coordinate falls inside the bounding box (inclusive). */
export function isWithinBounds(
  lat: number,
  lng: number,
  bounds: GeoBounds
): boolean {
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  );
}

/**
 * How far apart two records for the same storefront can sit. The curated
 * coordinates come from a geocoded street address while Google's come from the
 * business listing, so they disagree slightly; across a sample of shared sites
 * the gap was under 0.1 mi (median 0.015). Anything further apart is a genuinely
 * different location, not the same store.
 */
const SAME_PLACE_MILES = 0.1;

/**
 * Ignores case, punctuation, and accents: "Solé Bicycles" -> "solebicycles".
 * NFD splits an accented letter into the letter plus a combining mark, which the
 * alphanumeric filter then drops.
 */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Whether two places are the same real-world drop-off site.
 *
 * Curated ids never equal Google's place ids, so the search pipeline cannot
 * de-duplicate a curated site against the same store returned by Google Places
 * by id — it compares position and name instead. Both must agree: proximity
 * alone would merge the bike shop and the hardware store sharing a plaza, and
 * names alone would merge two branches of the same chain across town.
 *
 * Names are compared by containment rather than equality because Google tends to
 * return the fuller trading name ("Lowe's" vs "Lowe's Home Improvement").
 */
export function isSamePlace(a: Place, b: Place): boolean {
  if (haversineDistance(a.lat, a.lng, b.lat, b.lng) > SAME_PLACE_MILES) {
    return false;
  }

  const nameA = normalizeName(a.name);
  const nameB = normalizeName(b.name);
  const [shorter, longer] =
    nameA.length <= nameB.length ? [nameA, nameB] : [nameB, nameA];

  // Guards against a stub name matching everything at the same address.
  if (shorter.length < 4) return false;

  return longer.includes(shorter);
}
