import { useCallback, useEffect, useRef, useState } from "react";
import { getCuratedPlaces } from "@/lib/curated";
import { isSamePlace } from "@/lib/curated/geo";
import { searchPlaces } from "@/lib/googlePlaces";
import type { LocationCategoryKey } from "@/lib/locationCategories";
import type { Place } from "@/lib/types";

export interface UseLocationSearchOptions {
  categoryKey: LocationCategoryKey;
  locationLabel: string;
  lat?: number | null;
  lng?: number | null;
  item?: string | null;
  queries?: string[] | null;
}

export interface UseLocationSearchReturn {
  places: Place[];
  isLoading: boolean;
  error: string | null;
  search: (options?: Partial<UseLocationSearchOptions>) => Promise<void>;
  clearError: () => void;
}

export function useLocationSearch(
  initialOptions: UseLocationSearchOptions
): UseLocationSearchReturn {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optionsRef = useRef(initialOptions);
  const searchSeqRef = useRef(0);

  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = initialOptions;
  }, [initialOptions]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const search = useCallback(async (overrideOptions?: Partial<UseLocationSearchOptions>) => {
    const currentOptions = { ...optionsRef.current, ...overrideOptions };
    const seq = ++searchSeqRef.current;

    setIsLoading(true);
    setError(null);

    try {
      // Get curated places first
      const curated = getCuratedPlaces({
        categoryKey: currentOptions.categoryKey,
        item: currentOptions.item,
        queries: currentOptions.queries,
        lat: currentOptions.lat,
        lng: currentOptions.lng,
        locationLabel: currentOptions.locationLabel
      });

      // If no API key, return curated only
      if (!process.env.GOOGLE_PLACES_API_KEY) {
        if (seq === searchSeqRef.current) {
          setPlaces(curated);
          setIsLoading(false);
        }
        return;
      }

      // Search Google Places
      const result = await searchPlaces({
        categoryKey: currentOptions.categoryKey,
        locationLabel: currentOptions.locationLabel,
        lat: currentOptions.lat ?? undefined,
        lng: currentOptions.lng ?? undefined,
        item: currentOptions.item ?? undefined,
        queries: currentOptions.queries ?? undefined
      });

      // Check if this search is still the latest
      if (seq !== searchSeqRef.current) return;

      if (result.error && result.places.length === 0) {
        setError(result.error);
        setPlaces(curated);
      } else {
        // Merge curated and Google places, deduplicating
        const seen = new Set<string>();
        const merged: Place[] = [...curated];

        for (const place of curated) {
          seen.add(place.id);
        }

        for (const place of result.places) {
          if (seen.has(place.id)) continue;
          if (curated.some((c) => isSamePlace(c, place))) continue;
          seen.add(place.id);
          merged.push(place);
        }

        setPlaces(merged);
      }
    } catch (err) {
      if (seq !== searchSeqRef.current) return;
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      if (seq === searchSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  return {
    places,
    isLoading,
    error,
    search,
    clearError
  };
}
