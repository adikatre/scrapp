import type { SavedLocationPrefs } from "./types";

/** Haversine distance in miles between two lat/lng points */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return "< 0.1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export const LOCATIONS_STORAGE_KEY = "scrapp-locations-prefs";

export function readSavedLocationPrefs(): SavedLocationPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (!raw) return null;
    const prefs = JSON.parse(raw) as SavedLocationPrefs;
    if (!prefs.label) return null;
    return prefs;
  } catch {
    return null;
  }
}

export function saveLocationPrefs(prefs: SavedLocationPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(prefs));
}
