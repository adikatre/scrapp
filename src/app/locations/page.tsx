"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { AlertCircle, Camera, List, Map as MapIcon, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CategoryTabs } from "@/components/locations/CategoryTabs";
import { MapPanel } from "@/components/locations/MapPanel";
import { PlaceCard } from "@/components/locations/PlaceCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationSearchWidget, type LocationSelection } from "@/components/widgets/location-search";
import useMediaQuery from "@/hooks/useMediaQuery";
import { haversineDistance, readSavedLocationPrefs, saveLocationPrefs } from "@/lib/geo";
import { getPlaceDetails, searchPlaces } from "@/lib/googlePlaces";
import {
  getCategoryByKey,
  getCurbsideBinInfo,
  itemAffectsSearch,
  type LocationCategoryKey
} from "@/lib/locationCategories";
import {
  buildLocationSearchHref,
  decodeLocationSearchParams,
  mergeLocationSearchParams
} from "@/lib/locationSearchParams";
import type { Place, PlaceDetails } from "@/lib/types";

function LocationsPageContent() {
  const searchParams = useSearchParams();
  const searchParamsObj = useMemo(() => decodeLocationSearchParams(searchParams), [searchParams]);
  const {
    category: initialCategory,
    item: scannedItem,
    queries: scannedQueries,
    bin: curbsideBinRaw
  } = searchParamsObj;
  const curbsideBin = curbsideBinRaw ? getCurbsideBinInfo(curbsideBinRaw) : undefined;

  const savedOnMount = useMemo(() => readSavedLocationPrefs(), []);

  const activeCategory =
    !searchParams.get("category") && savedOnMount?.category
      ? (savedOnMount.category as LocationCategoryKey)
      : initialCategory;
  const [locationLabel, setLocationLabel] = useState(() => savedOnMount?.label ?? "San Diego, CA");
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(() =>
    savedOnMount?.lat != null && savedOnMount?.lng != null
      ? { lat: savedOnMount.lat, lng: savedOnMount.lng }
      : null
  );
  const [places, setPlaces] = useState<Place[]>([]);
  const [listFilter, setListFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, PlaceDetails>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [isLocating, setIsLocating] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const isDesktop = useMediaQuery(1024);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const searchSeqRef = useRef(0);
  const expandSeqRef = useRef(0);
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const setCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    cardRefs.current[id] = el;
  }, []);

  const category = getCategoryByKey(activeCategory);
  const isSearchable = category?.searchable ?? true;
  const showCurbsideNote = !!curbsideBin && activeCategory === curbsideBin.categoryKey;
  const CurbsideIcon = category?.icon;

  const runSearch = useCallback(
    async (opts?: { lat?: number; lng?: number; label?: string }) => {
      if (!isSearchable) {
        searchSeqRef.current++;
        setPlaces([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      const seq = ++searchSeqRef.current;
      setIsLoading(true);
      setError(null);
      setSelectedPlaceId(null);

      const label = opts?.label ?? locationLabel;
      const lat = opts?.lat ?? userCoords?.lat;
      const lng = opts?.lng ?? userCoords?.lng;

      const itemQueries = scannedQueries.length > 0 ? scannedQueries : undefined;

      const { places: results, error: searchError } = await searchPlaces({
        categoryKey: activeCategory,
        locationLabel: label,
        lat,
        lng,
        item: scannedItem ?? undefined,
        queries: itemQueries
      });

      if (seq !== searchSeqRef.current) return;

      let sorted = results;
      if (lat != null && lng != null) {
        sorted = [...results]
          .map((p) => ({
            ...p,
            distanceMiles: haversineDistance(lat, lng, p.lat, p.lng)
          }))
          .sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0));
      }

      setPlaces(sorted);
      setError(searchError ?? null);
      setIsLoading(false);

      if (lat != null && lng != null) {
        saveLocationPrefs({
          lat,
          lng,
          label,
          category: activeCategory
        });
      }
    },
    [activeCategory, isSearchable, locationLabel, userCoords, scannedItem, scannedQueries]
  );

  const runSearchRef = useRef(runSearch);
  useEffect(() => {
    runSearchRef.current = runSearch;
  }, [runSearch]);

  useEffect(() => {
    let cancelled = false;

    async function resolveLocation() {
      if (!navigator.geolocation) {
        setLocationReady(true);
        return;
      }

      try {
        const permission = await navigator.permissions.query({
          name: "geolocation"
        });

        if (cancelled) return;

        if (permission.state === "granted") {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (cancelled) return;
              setUserCoords({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              });
              setLocationLabel("Your location");
              setGeoError(null);
              setLocationReady(true);
            },
            () => {
              if (cancelled) return;
              setLocationReady(true);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000
            }
          );
          return;
        }
      } catch {
        // Permissions API unavailable
      }

      setLocationReady(true);
    }

    resolveLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  const scannedQueriesKey = scannedQueries.join("\u001f");
  // biome-ignore lint/correctness/useExhaustiveDependencies: URL context must retrigger the latest search callback.
  useEffect(() => {
    if (!locationReady) return;
    runSearchRef.current();
  }, [activeCategory, locationReady, scannedItem, scannedQueriesKey]);

  const handleSelectSubcategory = (key: LocationCategoryKey, item: string) => {
    const params = mergeLocationSearchParams(searchParamsObj, {
      category: key,
      item,
      queries: [],
      bin: null
    });
    const href = buildLocationSearchHref(params);
    window.history.replaceState(null, "", href);
  };

  const handleSelectCategory = (key: LocationCategoryKey) => {
    const params = mergeLocationSearchParams(searchParamsObj, {
      category: key,
      item: null,
      queries: [],
      bin: null
    });
    const href = buildLocationSearchHref(params);
    window.history.replaceState(null, "", href);
  };

  const filteredPlaces = useMemo(() => {
    const q = listFilter.trim().toLowerCase();
    if (!q) return places;
    return places.filter(
      (p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
    );
  }, [places, listFilter]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Your browser cannot find your location.");
      return;
    }

    setGeoError(null);
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setIsLocating(false);
        setUserCoords({ lat, lng });
        setLocationLabel("Your location");
        runSearch({ lat, lng, label: "Your location" });
      },
      () => {
        setIsLocating(false);
        setGeoError("We could not get your location. Type a city or zip code instead.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleLocationSelect = (selection: LocationSelection) => {
    setGeoError(null);
    setUserCoords({ lat: selection.lat, lng: selection.lng });
    setLocationLabel(selection.label);
    runSearch({
      lat: selection.lat,
      lng: selection.lng,
      label: selection.label
    });
  };

  const handleManualSubmit = async (label: string) => {
    setGeoError(null);

    if (typeof google !== "undefined" && google.maps?.Geocoder) {
      try {
        const geocoder = new google.maps.Geocoder();
        const { results } = await geocoder.geocode({
          address: label,
          region: "us"
        });
        const location = results?.[0]?.geometry?.location;
        if (location) {
          const lat = location.lat();
          const lng = location.lng();
          const resolvedLabel = results[0].formatted_address ?? label;
          setUserCoords({ lat, lng });
          setLocationLabel(resolvedLabel);
          runSearch({ lat, lng, label: resolvedLabel });
          return;
        }
      } catch {
        // Geocoder throws on ZERO_RESULTS
      }
    }

    setUserCoords(null);
    runSearch({ label });
  };

  const handleSelectPlace = (placeId: string) => {
    setSelectedPlaceId(placeId);
    if (!isDesktop) setMobileView("list");
    cardRefs.current[placeId]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  };

  const handleExpandPlace = async (place: Place) => {
    if (expandedDetails[place.id]) {
      setExpandedDetails((prev) => {
        const next = { ...prev };
        delete next[place.id];
        return next;
      });
      return;
    }

    if (place.curated) {
      setExpandedDetails((prev) => ({
        ...prev,
        [place.id]: { ...place, phone: place.phone }
      }));
      return;
    }

    const seq = ++expandSeqRef.current;
    setLoadingDetails((prev) => ({ ...prev, [place.id]: true }));
    const { details, error: detailsError } = await getPlaceDetails(place.id);

    if (seq !== expandSeqRef.current) return;

    setLoadingDetails((prev) => ({ ...prev, [place.id]: false }));

    if (details) {
      setExpandedDetails((prev) => ({
        ...prev,
        [place.id]: { ...details, distanceMiles: place.distanceMiles }
      }));
    } else if (detailsError) {
      setError(detailsError);
    }
  };

  const directionsUrl = (place: Place) =>
    place.curated
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${place.name}, ${place.address}`)}&destination_place_id=${encodeURIComponent(place.id)}`;

  const content = (
    <div className="route-locations flex min-h-[100dvh] flex-col gap-6 bg-background px-4 pt-6 pb-28 sm:px-6 sm:pt-24 lg:h-[100dvh] lg:flex-row lg:gap-0 lg:overflow-hidden lg:pb-6">
      <Card className="route-locations__panel flex w-full flex-col rounded-none border-0 bg-transparent p-0 shadow-none lg:h-full lg:w-[min(35rem,44vw)] lg:flex-none lg:border-r lg:border-border lg:pr-8">
        <CardHeader className="route-locations__header shrink-0 px-0 pt-0">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Find a drop-off
          </h1>
          {scannedItem && category && (
            <p className="text-sm text-muted-foreground mt-1">
              {(activeCategory === initialCategory && scannedQueries.length > 0) ||
              itemAffectsSearch(activeCategory, scannedItem)
                ? "Showing drop-off locations that accept your "
                : `Showing ${category.label} drop-offs for your `}
              <span className="font-medium text-foreground">{scannedItem}</span>
            </p>
          )}
        </CardHeader>

        <CardContent className="flex flex-grow flex-col gap-4 overflow-visible px-0 pb-0 lg:overflow-hidden">
          <div className="shrink-0">
            <LocationSearchWidget
              value={locationLabel}
              onChange={setLocationLabel}
              onSelectSuggestion={handleLocationSelect}
              onManualSubmit={handleManualSubmit}
              onUseMyLocation={handleUseMyLocation}
              bias={userCoords}
              isLocating={isLocating}
            />
          </div>

          {geoError && (
            <p className="text-sm text-amber-500 flex items-start gap-2 shrink-0">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {geoError}
            </p>
          )}

          <CategoryTabs
            activeCategory={activeCategory}
            activeItem={scannedItem}
            onSelectCategory={handleSelectCategory}
            onSelectSubcategory={handleSelectSubcategory}
          />

          {isSearchable && (
            <fieldset className="grid grid-cols-2 border-y border-border py-1 lg:hidden">
              <legend className="sr-only">Results view</legend>
              <Button
                type="button"
                variant={mobileView === "list" ? "secondary" : "ghost"}
                onClick={() => setMobileView("list")}
                aria-pressed={mobileView === "list"}>
                <List className="size-4" /> List
              </Button>
              <Button
                type="button"
                variant={mobileView === "map" ? "secondary" : "ghost"}
                onClick={() => setMobileView("map")}
                aria-pressed={mobileView === "map"}>
                <MapIcon className="size-4" /> Map
              </Button>
            </fieldset>
          )}

          {showCurbsideNote && curbsideBin && (
            <Card className={`p-4 shrink-0 border ${curbsideBin.accent}`}>
              <p className="text-sm text-foreground flex items-start gap-2">
                {CurbsideIcon && <CurbsideIcon className="h-4 w-4 mt-0.5 shrink-0" />}
                {curbsideBin.note}
              </p>
              {!isSearchable && (
                <Button asChild variant="link" className="px-0 mt-2">
                  <Link href="/cam">
                    <Camera className="h-4 w-4 mr-1 inline" />
                    Scan another item
                  </Link>
                </Button>
              )}
            </Card>
          )}

          {!isSearchable && category?.infoMessage && !showCurbsideNote && (
            <Card className="p-4 bg-muted/50 shrink-0">
              <p className="text-sm text-muted-foreground">{category.infoMessage}</p>
              <Button asChild variant="link" className="px-0 mt-2">
                <Link href="/cam">
                  <Camera className="h-4 w-4 mr-1 inline" />
                  Scan another item
                </Link>
              </Button>
            </Card>
          )}

          {isSearchable && (
            <>
              <div className="relative shrink-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Filter drop-off results"
                  placeholder="Filter by name or address"
                  value={listFilter}
                  onChange={(event) => setListFilter(event.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs font-semibold text-muted-foreground" aria-live="polite">
                {isLoading
                  ? "Searching nearby"
                  : `${filteredPlaces.length} ${filteredPlaces.length === 1 ? "place" : "places"} found`}
              </p>

              <section
                className="min-h-0 flex-1 space-y-0 border-t border-border pr-1 lg:overflow-y-auto"
                aria-label="Drop-off results">
                {isLoading && (
                  <>
                    <p className="text-sm text-muted-foreground animate-pulse">
                      Finding drop-off places near you...
                    </p>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Card key={i} className="p-4 bg-muted/50">
                        <div className="flex items-start gap-3">
                          <Skeleton className="h-14 w-14 shrink-0 rounded-md" />
                          <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <div className="flex gap-2 pt-1">
                              <Skeleton className="h-8 w-28" />
                              <Skeleton className="h-8 w-20" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </>
                )}

                {!isLoading && error && (
                  <Card className="p-4 bg-destructive/10 border-destructive/30">
                    <p className="text-sm text-destructive flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      {error}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => void runSearch()}>
                      Retry search
                    </Button>
                  </Card>
                )}

                {!isLoading && !error && filteredPlaces.length === 0 && (
                  <Card className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      We did not find any places here. Try a different city, widen your search, or
                      switch categories.
                    </p>
                  </Card>
                )}

                {!isLoading &&
                  filteredPlaces.map((place) => (
                    <div key={place.id} ref={(el) => setCardRef(place.id, el)}>
                      <PlaceCard
                        place={place}
                        isSelected={selectedPlaceId === place.id}
                        isExpanded={!!expandedDetails[place.id]}
                        details={expandedDetails[place.id]}
                        isLoadingDetails={loadingDetails[place.id]}
                        hasFailedImage={failedImages.has(place.photoName ?? "")}
                        onSelect={() => setSelectedPlaceId(place.id)}
                        onExpand={() => handleExpandPlace(place)}
                        onImageError={(name) => setFailedImages((prev) => new Set(prev).add(name))}
                        directionsUrl={directionsUrl}
                      />
                    </div>
                  ))}
              </section>
            </>
          )}
        </CardContent>
      </Card>

      {(isDesktop || mobileView === "map") &&
        (mapsApiKey ? (
          <APIProvider apiKey={mapsApiKey} libraries={["places"]}>
            <MapPanel
              places={filteredPlaces}
              userLat={userCoords?.lat}
              userLng={userCoords?.lng}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={handleSelectPlace}
              isSearchable={isSearchable}
            />
          </APIProvider>
        ) : (
          <div className="route-map-fallback flex min-h-72 flex-1 items-center justify-center border border-border bg-muted/30 p-8 text-center">
            <div>
              <MapPin className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-4 font-semibold">Map unavailable</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                The results list still works. Add a Google Maps key to enable the map view.
              </p>
            </div>
          </div>
        ))}
    </div>
  );

  return content;
}

export default function LocationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-background p-6 pt-24">
          <Skeleton className="h-[80vh] w-full" />
        </div>
      }>
      <LocationsPageContent />
    </Suspense>
  );
}
