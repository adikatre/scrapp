"use client";

import { ChevronDown, ChevronUp, Clock, Globe, MapPin, Navigation, Phone } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance, haversineDistance } from "@/lib/geo";
import {
  getCategoryByKey,
  getCurbsideBinInfo,
  type LocationCategoryKey
} from "@/lib/locationCategories";
import type { Place, PlaceDetails } from "@/lib/types";
import { cn } from "@/lib/utils";

export type LocationListWidgetProps = {
  places: Place[];
  userCoords?: { lat: number; lng: number } | null;
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
  listFilter?: string;
  onListFilterChange?: (filter: string) => void;
  isLoading?: boolean;
  error?: string | null;
  activeCategory?: LocationCategoryKey;
  curbsideBin?: string | null;
  expandedDetails?: Record<string, PlaceDetails>;
  onExpandDetails?: (placeId: string) => void;
  loadingDetails?: Record<string, boolean>;
};

export function LocationListWidget({
  places,
  userCoords,
  selectedPlaceId,
  onSelectPlace,
  listFilter = "",
  onListFilterChange,
  isLoading,
  error,
  activeCategory,
  curbsideBin,
  expandedDetails,
  onExpandDetails,
  loadingDetails
}: LocationListWidgetProps) {
  const category = getCategoryByKey(activeCategory ?? "recycle");
  const _isSearchable = category?.searchable ?? true;
  const showCurbsideBin =
    !!curbsideBin && activeCategory === getCurbsideBinInfo(curbsideBin)?.categoryKey;
  const CurbsideIcon = category?.icon;

  const filteredPlaces = useMemo(() => {
    if (!listFilter) return places;
    const lower = listFilter.toLowerCase();
    return places.filter(
      (p) => p.name.toLowerCase().includes(lower) || p.address.toLowerCase().includes(lower)
    );
  }, [places, listFilter]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{error}</p>
      </div>
    );
  }

  if (filteredPlaces.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No locations found. Try adjusting your search or category.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {showCurbsideBin && CurbsideIcon && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-400">
          <div className="flex items-center gap-2">
            <CurbsideIcon className="h-4 w-4 shrink-0" />
            <span>
              This item goes in your <strong>{curbsideBin}</strong>. Drop-off locations below are
              for reference if you need an alternative.
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-2">
        <Input
          placeholder="Filter locations…"
          value={listFilter}
          onChange={(e) => onListFilterChange?.(e.target.value)}
          className="flex-1 max-w-xs"
        />
        <span className="text-sm text-muted-foreground self-center px-2">
          {filteredPlaces.length} of {places.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredPlaces.map((place) => {
          const isSelected = place.id === selectedPlaceId;
          const distance = userCoords
            ? haversineDistance(userCoords.lat, userCoords.lng, place.lat, place.lng)
            : null;
          const details = expandedDetails?.[place.id];
          const isLoadingDetails = loadingDetails?.[place.id];

          return (
            <Card
              key={place.id}
              className={cn(
                "cursor-pointer transition-all",
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
              onClick={() => onSelectPlace?.(place.id)}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 p-4 pb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "flex-shrink-0 size-10 rounded-lg flex items-center justify-center",
                        place.curated
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                      {place.curated ? (
                        <MapPin className="h-5 w-5" />
                      ) : (
                        <Globe className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base">{place.name}</CardTitle>
                      <p className="text-sm text-muted-foreground truncate">{place.address}</p>
                      {distance !== null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistance(distance)} away
                        </p>
                      )}
                    </div>
                  </div>
                  {place.note && (
                    <p className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      {place.note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {details || isLoadingDetails ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExpandDetails?.(place.id);
                      }}
                      className="h-8 w-8">
                      {isLoadingDetails ? (
                        <div className="animate-spin h-4 w-4 border-b-2 border-primary rounded-full" />
                      ) : details ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExpandDetails?.(place.id);
                      }}
                      className="h-8 w-8">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              {(details || isLoadingDetails) && (
                <CardContent className="px-4 pb-4 pt-0 animate-in fade-in slide-in-from-top-2 duration-200">
                  {isLoadingDetails ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  ) : details ? (
                    <div className="space-y-3 text-sm">
                      {details.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0" />
                          <a href={`tel:${details.phone}`} className="hover:text-foreground">
                            {details.phone}
                          </a>
                        </div>
                      )}
                      {details.website && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-4 w-4 shrink-0" />
                          <a
                            href={details.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground truncate">
                            {details.website}
                          </a>
                        </div>
                      )}
                      {details.rating !== undefined && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">{details.rating.toFixed(1)}</span>
                          <span>★</span>
                        </div>
                      )}
                      {details.openNow !== undefined && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>{details.openNow ? "Open now" : "Closed"}</span>
                        </div>
                      )}
                      {details.weekdayDescriptions && details.weekdayDescriptions.length > 0 && (
                        <div className="text-muted-foreground">
                          <p className="font-medium mb-1">Hours:</p>
                          <ul className="ml-4 space-y-1">
                            {details.weekdayDescriptions.map((day, i) => (
                              <li key={i} className="text-xs">
                                {day}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {details.googleMapsUri && (
                        <Link
                          href={details.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline text-sm mt-2">
                          <Navigation className="h-3 w-3" />
                          View on Google Maps
                        </Link>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
