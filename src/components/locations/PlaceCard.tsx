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
import { Button } from "@/components/ui/button";
import { trackProductEvent } from "@/lib/analytics";
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
    <article
      className={`route-place ${isSelected ? "is-selected" : ""}`}
      data-verified={place.curated ? "true" : "false"}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        className="route-place__select">
        <div className="route-place__image" aria-hidden="true">
          {place.photoName && !hasFailedImage ? (
            <img
              src={`/api/place-photo?name=${encodeURIComponent(place.photoName)}&w=176`}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => {
                if (place.photoName) onImageError(place.photoName);
              }}
            />
          ) : (
            <Compass />
          )}
        </div>

        <div className="min-w-0">
          <span className="route-place__status">
            {place.curated ? "Verified acceptance" : "Discovery result - call to confirm"}
          </span>
          <h3>{place.name}</h3>
          <p className="route-place__address">
            <Compass aria-hidden="true" />
            <span>{place.address}</span>
          </p>
        </div>

        {place.distanceMiles != null && (
          <span className="route-place__distance">{formatDistance(place.distanceMiles)}</span>
        )}
      </button>

      {place.note && (
        <p className="route-place__note">
          <AlertCircle aria-hidden="true" />
          <span>{place.note}</span>
        </p>
      )}

      <div className="route-place__actions">
        <Button size="sm" asChild>
          <a
            href={directionsUrl(place)}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() =>
              trackProductEvent("directions_clicked", {
                source: place.curated ? "verified" : "discovery"
              })
            }>
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
            "Loading..."
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
        <div className="route-place__details">
          {details.openNow != null && (
            <p>
              <Clock aria-hidden="true" />
              <span className={details.openNow ? "text-primary" : "text-muted-foreground"}>
                {details.openNow ? "Open now" : "Closed now"}
              </span>
            </p>
          )}
          {details.phone && (
            <p>
              <Phone aria-hidden="true" />
              <a href={`tel:${details.phone}`}>{details.phone}</a>
            </p>
          )}
          {details.website && (
            <p>
              <Globe aria-hidden="true" />
              <a href={details.website} target="_blank" rel="noreferrer noopener">
                Website
              </a>
            </p>
          )}
          {details.weekdayDescriptions && (
            <ul>
              {details.weekdayDescriptions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
