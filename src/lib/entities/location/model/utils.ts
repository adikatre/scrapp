import { formatDistance, haversineDistance } from "@/lib/geo";
import type { Place } from "@/lib/types";

/**
 * Sort places by distance from user location (closest first).
 */
export function sortPlacesByDistance(places: Place[], userLat: number, userLng: number): Place[] {
  return [...places].sort((a, b) => {
    const distA = haversineDistance(userLat, userLng, a.lat, a.lng);
    const distB = haversineDistance(userLat, userLng, b.lat, b.lng);
    return distA - distB;
  });
}

/**
 * Add distanceMiles to each place based on user location.
 */
export function addDistancesToPlaces(places: Place[], userLat: number, userLng: number): Place[] {
  return places.map((place) => ({
    ...place,
    distanceMiles: haversineDistance(userLat, userLng, place.lat, place.lng)
  }));
}

/**
 * Filter places by search query (name or address).
 */
export function filterPlacesByQuery(places: Place[], query: string): Place[] {
  if (!query.trim()) return places;
  const lowerQuery = query.toLowerCase();
  return places.filter(
    (place) =>
      place.name.toLowerCase().includes(lowerQuery) ||
      place.address.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get a display-friendly distance string for a place.
 */
export function getPlaceDistanceDisplay(place: Place): string {
  if (place.distanceMiles !== undefined) {
    return formatDistance(place.distanceMiles);
  }
  return "Distance unknown";
}

/**
 * Check if a place is curated (hand-maintained) vs from Google Places.
 */
export function isCuratedPlace(place: Place): boolean {
  return place.curated === true;
}
