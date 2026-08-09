"use client";

import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Globe,
  Navigation,
  Phone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistance } from "@/lib/geo";
import type { Place, PlaceDetails } from "@/lib/types";

interface PlaceCardProps {
  place: Place;
  isSelected: boolean;
  isExpanded: boolean;
  details?: PlaceDetails;
  isLoadingDetails?: boolean;
  hasFailedImage?: boolean;
  onSelect: () => void;
  onExpand: () => void;
  onImageError: (name: string) => void;
  directionsUrl: (place: Place) => string;
}

export function PlaceCard({
  place,
  isSelected,
  isExpanded,
  details,
  isLoadingDetails,
  hasFailedImage,
  onSelect,
  onExpand,
  onImageError,
  directionsUrl
}: PlaceCardProps) {
  return (
    <Card
      className={`overflow-hidden rounded-[18px] border bg-card p-0 transition-[border-color,box-shadow] duration-200 ${isSelected ? "border-primary ring-2 ring-primary/25" : "border-border"}`}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        className="flex min-h-20 w-full items-start gap-3 p-4 text-left hover:bg-muted/50">
        {place.photoName && !hasFailedImage && (
          <img
            src={`/api/place-photo?name=${encodeURIComponent(place.photoName)}&w=128`}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-14 shrink-0 rounded-xl bg-muted object-cover"
            onError={() => {
              if (place.photoName) onImageError(place.photoName);
            }}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold leading-snug">{place.name}</h3>
            {place.distanceMiles != null && (
              <Badge variant="secondary" className="shrink-0">
                {formatDistance(place.distanceMiles)}
              </Badge>
            )}
          </div>
          <p className="mt-1 flex items-start gap-2 text-sm leading-5 text-muted-foreground">
            <Compass className="mt-0.5 size-4 shrink-0" />
            {place.address}
          </p>
        </div>
      </button>
      {place.note && (
        <p className="mx-4 flex items-start gap-2 rounded-xl bg-primary/8 p-3 text-sm leading-5 text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
          {place.note}
        </p>
      )}
      <div className="flex flex-wrap gap-2 px-4 py-3">
        <Button size="sm" variant="outline" asChild>
          <a href={directionsUrl(place)} target="_blank" rel="noreferrer noopener">
            <Navigation className="size-4" /> Directions
          </a>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onExpand}
          disabled={isLoadingDetails}
          aria-expanded={isExpanded}>
          {isLoadingDetails ? (
            "Loading…"
          ) : isExpanded ? (
            <>
              <ChevronUp className="size-4" /> Less
            </>
          ) : (
            <>
              <ChevronDown className="size-4" /> Details
            </>
          )}
        </Button>
      </div>
      {isExpanded && details && (
        <div className="space-y-2 border-t border-border px-4 py-4 text-sm">
          {details.openNow != null && (
            <p className="flex items-center gap-2">
              <Clock className="size-4" />
              <span
                className={
                  details.openNow ? "font-semibold text-primary" : "text-muted-foreground"
                }>
                {details.openNow ? "Open now" : "Closed now"}
              </span>
            </p>
          )}
          {details.phone && (
            <p className="flex items-center gap-2">
              <Phone className="size-4" />
              <a href={`tel:${details.phone}`} className="text-primary underline">
                {details.phone}
              </a>
            </p>
          )}
          {details.website && (
            <p className="flex items-center gap-2">
              <Globe className="size-4" />
              <a
                href={details.website}
                target="_blank"
                rel="noreferrer noopener"
                className="truncate text-primary underline">
                Website
              </a>
            </p>
          )}
          {details.weekdayDescriptions && (
            <ul className="space-y-1 text-muted-foreground">
              {details.weekdayDescriptions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
