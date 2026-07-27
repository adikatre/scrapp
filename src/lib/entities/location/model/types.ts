import type { Place, PlaceDetails, SavedLocationPrefs } from "@/lib/types";

export type { Place, PlaceDetails, SavedLocationPrefs };

export interface LocationSearchParams {
  categoryKey: string;
  locationLabel: string;
  lat?: number;
  lng?: number;
  item?: string;
  queries?: string[];
}

export interface LocationSearchResult {
  places: Place[];
  error?: string;
}
