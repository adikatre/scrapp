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
