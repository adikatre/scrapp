"use client";

import { Map, Marker, useApiIsLoaded } from "@vis.gl/react-google-maps";
import { Place } from "@/lib/types";

type LocationsMapProps = {
  places: Place[];
  userLat?: number;
  userLng?: number;
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
};

// Rendered inside the page's <APIProvider>; callers should show the
// "missing API key" fallback themselves before mounting this component.
export function LocationsMap({
  places,
  userLat,
  userLng,
  selectedPlaceId,
  onSelectPlace
}: LocationsMapProps) {
  // Symbol icons need the google.maps namespace, which only exists once the
  // Maps JS API has loaded — guard so the first render can't throw.
  const apiIsLoaded = useApiIsLoaded();

  const center =
    userLat != null && userLng != null
      ? { lat: userLat, lng: userLng }
      : places.length > 0
        ? { lat: places[0].lat, lng: places[0].lng }
        : { lat: 32.7157, lng: -117.1611 };

  return (
    <Map
      key={`${center.lat}-${center.lng}-${places.length}`}
      defaultCenter={center}
      defaultZoom={12}
      gestureHandling="greedy"
      disableDefaultUI={false}
      style={{ width: "100%", height: "100%", minHeight: "300px" }}
    >
      {/* Blue "you are here" dot with halo — visually distinct from the red
          drop-off pins so it can't be mistaken for a location result. */}
      {apiIsLoaded && userLat != null && userLng != null && (
        <>
          <Marker
            position={{ lat: userLat, lng: userLng }}
            title="Your location"
            clickable={false}
            zIndex={999}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 16,
              fillColor: "#4285F4",
              fillOpacity: 0.2,
              strokeWeight: 0
            }}
          />
          <Marker
            position={{ lat: userLat, lng: userLng }}
            title="Your location"
            clickable={false}
            zIndex={1000}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2.5
            }}
          />
        </>
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
  );
}
