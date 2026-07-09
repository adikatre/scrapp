"use client";

import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { Place } from "@/lib/types";

type LocationsMapProps = {
  places: Place[];
  userLat?: number;
  userLng?: number;
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
};

export function LocationsMap({
  places,
  userLat,
  userLng,
  selectedPlaceId,
  onSelectPlace
}: LocationsMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const center =
    userLat != null && userLng != null
      ? { lat: userLat, lng: userLng }
      : places.length > 0
        ? { lat: places[0].lat, lng: places[0].lng }
        : { lat: 32.7157, lng: -117.1611 };

  if (!apiKey) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local to enable the interactive map.
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        key={`${center.lat}-${center.lng}-${places.length}`}
        defaultCenter={center}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI={false}
        style={{ width: "100%", height: "100%", minHeight: "300px" }}
      >
        {userLat != null && userLng != null && (
          <Marker
            position={{ lat: userLat, lng: userLng }}
            title="Your location"
          />
        )}
        {places.map((place) => (
          <Marker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            title={place.name}
            onClick={() => onSelectPlace?.(place.id)}
          />
        ))}
      </Map>
    </APIProvider>
  );
}
