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
      className={`p-4 bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}>
      <div className="flex items-start gap-3">
        {place.photoName && !hasFailedImage && (
          <img
            src={`/api/place-photo?name=${encodeURIComponent(place.photoName)}&w=128`}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-14 w-14 shrink-0 rounded-md bg-muted object-cover"
            onError={() => {
              if (place.photoName) onImageError(place.photoName);
            }}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground">{place.name}</h3>
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
        </div>
      </div>

      {place.note && (
        <p className="text-sm text-muted-foreground flex items-start gap-2 mt-1">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          {place.note}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        <Button size="sm" variant="outline" asChild onClick={(e) => e.stopPropagation()}>
          <a href={directionsUrl(place)} target="_blank" rel="noreferrer noopener">
            <Navigation className="h-3.5 w-3.5 mr-1" />
            Directions
          </a>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          disabled={isLoadingDetails}>
          {isLoadingDetails ? (
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
                <span className="text-green-500">Open now</span>
              ) : (
                <span className="text-muted-foreground">Closed now</span>
              )}
            </p>
          )}
          {details.phone && (
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href={`tel:${details.phone}`} className="text-primary underline">
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
                className="text-primary underline truncate">
                Website
              </a>
            </p>
          )}
          {details.weekdayDescriptions && details.weekdayDescriptions.length > 0 && (
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
}
