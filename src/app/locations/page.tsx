"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { LocationsMap } from "@/components/LocationsMap";
import { getPlaceDetails, searchPlaces } from "@/lib/googlePlaces";
import {
  getCategoryByKey,
  itemAffectsSearch,
  LOCATION_CATEGORIES,
  type LocationCategoryKey
} from "@/lib/locationCategories";
import {
  formatDistance,
  haversineDistance,
  readSavedLocationPrefs,
  saveLocationPrefs
} from "@/lib/geo";
import { Place, PlaceDetails } from "@/lib/types";
import {
  MapPin,
  Search,
  Compass,
  Phone,
  Globe,
  Navigation,
  LocateFixed,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Camera,
  Clock
} from "lucide-react";

function LocationsPageContent() {
  const searchParams = useSearchParams();
  const initialCategory =
    (searchParams.get("category") as LocationCategoryKey) || "recycle";
  const scannedItem = searchParams.get("item");
  const scannedQueries = useMemo(
    () => searchParams.getAll("q"),
    [searchParams]
  );

  const savedOnMount = useMemo(() => readSavedLocationPrefs(), []);

  const [activeCategory, setActiveCategory] = useState<LocationCategoryKey>(
    () =>
      !searchParams.get("category") && savedOnMount?.category
        ? (savedOnMount.category as LocationCategoryKey)
        : initialCategory
  );
  const [locationLabel, setLocationLabel] = useState(
    () => savedOnMount?.label ?? "San Diego, CA"
  );
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(() =>
    savedOnMount?.lat && savedOnMount?.lng
      ? { lat: savedOnMount.lat, lng: savedOnMount.lng }
      : null
  );
  const [places, setPlaces] = useState<Place[]>([]);
  const [listFilter, setListFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [usingDeviceLocation, setUsingDeviceLocation] = useState(
    () => savedOnMount?.label === "Your location"
  );
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<
    Record<string, PlaceDetails>
  >({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>(
    {}
  );

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const category = getCategoryByKey(activeCategory);
  const isSearchable = category?.searchable ?? true;

  const runSearch = useCallback(
    async (opts?: { lat?: number; lng?: number; label?: string }) => {
      if (!isSearchable) {
        setPlaces([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      const label = opts?.label ?? locationLabel;
      const lat = opts?.lat ?? userCoords?.lat;
      const lng = opts?.lng ?? userCoords?.lng;

      // Scanner-provided queries are tied to the scanned item's category;
      // switching tabs falls back to the plain category search.
      const itemQueries =
        activeCategory === initialCategory && scannedQueries.length > 0
          ? scannedQueries
          : undefined;

      const { places: results, error: searchError } = await searchPlaces({
        categoryKey: activeCategory,
        locationLabel: label,
        lat,
        lng,
        item: scannedItem ?? undefined,
        queries: itemQueries
      });

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
    [
      activeCategory,
      initialCategory,
      isSearchable,
      locationLabel,
      userCoords,
      scannedItem,
      scannedQueries
    ]
  );

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

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

        // "prompt" triggers the browser's permission dialog — without real
        // coordinates the search can't be biased to truly nearby places.
        if (permission.state === "granted" || permission.state === "prompt") {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (cancelled) return;
              setUserCoords({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              });
              setLocationLabel("Your location");
              setUsingDeviceLocation(true);
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
        // Permissions API unavailable — fall back to saved or manual location.
      }

      setLocationReady(true);
    }

    resolveLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!locationReady) return;
    runSearch();
  }, [activeCategory, locationReady, runSearch]);

  const filteredPlaces = useMemo(() => {
    const q = listFilter.trim().toLowerCase();
    if (!q) return places;
    return places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
    );
  }, [places, listFilter]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }

    setGeoError(null);
    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });
        setLocationLabel("Your location");
        setUsingDeviceLocation(true);
        runSearch({ lat, lng, label: "Your location" });
      },
      () => {
        setGeoError(
          "Location access denied. Enter a city or zip code and search manually."
        );
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleManualSearch = () => {
    setUserCoords(null);
    setUsingDeviceLocation(false);
    runSearch({ label: locationLabel });
  };

  const handleSelectPlace = (placeId: string) => {
    setSelectedPlaceId(placeId);
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

    // Curated entries carry their own details (phone); no Places lookup needed.
    if (place.curated) {
      setExpandedDetails((prev) => ({
        ...prev,
        [place.id]: { ...place, phone: place.phone }
      }));
      return;
    }

    setLoadingDetails((prev) => ({ ...prev, [place.id]: true }));
    const { details, error: detailsError } = await getPlaceDetails(place.id);
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

  // Curated entries have no Google Place ID, so route directions by coordinates.
  const directionsUrl = (place: Place) =>
    place.curated
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination_place_id=${encodeURIComponent(place.id)}`;

  return (
    <div className="dark max-h-screen bg-background flex flex-col lg:flex-row p-4 lg:p-6 gap-6 min-h-screen">
      <Card className="w-full lg:w-1/3 lg:max-w-md flex flex-col border-border shadow-lg max-h-[calc(100vh-3rem)]">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="text-primary" />
            Find Disposal & Donation Centers
          </CardTitle>
          {scannedItem && category && (
            <p className="text-sm text-muted-foreground mt-1">
              {(activeCategory === initialCategory &&
                scannedQueries.length > 0) ||
              itemAffectsSearch(activeCategory, scannedItem)
                ? "Showing drop-off locations that accept your "
                : `Showing ${category.label} drop-offs for your `}
              <span className="font-medium text-foreground">{scannedItem}</span>
            </p>
          )}
        </CardHeader>

        <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
          <div className="flex gap-2 shrink-0">
            <Input
              placeholder="Enter city or zip code..."
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
            />
            <Button onClick={handleManualSearch} disabled={isLoading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleUseMyLocation}
            disabled={isLoading}
            className="shrink-0 flex items-center gap-2"
          >
            <LocateFixed className="h-4 w-4" />
            {usingDeviceLocation ? "Update my location" : "Use my location"}
          </Button>

          {geoError && (
            <p className="text-sm text-amber-500 flex items-start gap-2 shrink-0">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {geoError}
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 shrink-0">
            {LOCATION_CATEGORIES.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={activeCategory === key ? "default" : "outline"}
                onClick={() => setActiveCategory(key)}
                className="flex items-center gap-1.5 text-xs px-2"
                size="sm"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Button>
            ))}
          </div>

          {!isSearchable && category?.infoMessage && (
            <Card className="p-4 bg-muted/50 shrink-0">
              <p className="text-sm text-muted-foreground">
                {category.infoMessage}
              </p>
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
              <Input
                placeholder="Filter results..."
                value={listFilter}
                onChange={(e) => setListFilter(e.target.value)}
                className="shrink-0"
              />

              <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
                {isLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}

                {!isLoading && error && (
                  <Card className="p-4 bg-destructive/10 border-destructive/30">
                    <p className="text-sm text-destructive flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      {error}
                    </p>
                  </Card>
                )}

                {!isLoading && !error && filteredPlaces.length === 0 && (
                  <Card className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      No locations found for this area. Try a different city,
                      widen your search, or switch categories.
                    </p>
                  </Card>
                )}

                {!isLoading &&
                  filteredPlaces.map((place) => {
                    const details = expandedDetails[place.id];
                    const isExpanded = !!details;
                    const isSelected = selectedPlaceId === place.id;

                    return (
                      <Card
                        key={place.id}
                        ref={(el) => {
                          cardRefs.current[place.id] = el;
                        }}
                        className={`p-4 bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer ${
                          isSelected ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setSelectedPlaceId(place.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground">
                            {place.name}
                          </h3>
                          {place.distanceMiles != null && (
                            <Badge variant="secondary" className="shrink-0">
                              {formatDistance(place.distanceMiles)}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Compass className="h-4 w-4 shrink-0" />
                          {place.address}
                        </p>

                        {place.note && (
                          <p className="text-sm text-muted-foreground flex items-start gap-2 mt-1">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                            {place.note}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a
                              href={directionsUrl(place)}
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              <Navigation className="h-3.5 w-3.5 mr-1" />
                              Directions
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExpandPlace(place);
                            }}
                            disabled={loadingDetails[place.id]}
                          >
                            {loadingDetails[place.id] ? (
                              "Loading..."
                            ) : isExpanded ? (
                              <>
                                <ChevronUp className="h-3.5 w-3.5 mr-1" />
                                Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                                Details
                              </>
                            )}
                          </Button>
                        </div>

                        {isExpanded && details && (
                          <div className="mt-3 pt-3 border-t border-border/50 space-y-2 text-sm">
                            {details.openNow != null && (
                              <p className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {details.openNow ? (
                                  <span className="text-green-500">
                                    Open now
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Closed now
                                  </span>
                                )}
                              </p>
                            )}
                            {details.phone && (
                              <p className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <a
                                  href={`tel:${details.phone}`}
                                  className="text-primary underline"
                                >
                                  {details.phone}
                                </a>
                              </p>
                            )}
                            {details.website && (
                              <p className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                <a
                                  href={details.website}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="text-primary underline truncate"
                                >
                                  Website
                                </a>
                              </p>
                            )}
                            {details.weekdayDescriptions &&
                              details.weekdayDescriptions.length > 0 && (
                                <ul className="text-muted-foreground space-y-0.5">
                                  {details.weekdayDescriptions.map((line) => (
                                    <li key={line}>{line}</li>
                                  ))}
                                </ul>
                              )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex-grow rounded-lg overflow-hidden relative shadow-lg min-h-[300px] lg:min-h-0">
        {isSearchable ? (
          <LocationsMap
            places={filteredPlaces}
            userLat={userCoords?.lat}
            userLng={userCoords?.lng}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={handleSelectPlace}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted/20 p-8 text-center">
            <div>
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No map needed for this disposal type.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try a searchable category like Recycling, E-Waste, or Hazardous
                Waste.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LocationsPage() {
  return (
    <Suspense
      fallback={
        <div className="dark min-h-screen bg-background p-6">
          <Skeleton className="h-[80vh] w-full" />
        </div>
      }
    >
      <LocationsPageContent />
    </Suspense>
  );
}
