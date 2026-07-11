"use client";

import { useEffect } from "react";
import { Map, Marker, useApiIsLoaded, useMap } from "@vis.gl/react-google-maps";
import { Place } from "@/lib/types";

type LocationsMapProps = {
  places: Place[];
  userLat?: number;
  userLng?: number;
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
};

/** Material-style map pin, 24x24 viewBox, tip at (12, 22) */
const PIN_PATH =
  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z";

// Matches the app's primary green so the highlighted pin reads as "selected",
// same as the ring around the selected sidebar card.
const SELECTED_PIN_COLOR = "#10B981";
const DEFAULT_PIN_COLOR = "#EA4335";

function pinIcon(selected: boolean): google.maps.Symbol {
  return {
    path: PIN_PATH,
    fillColor: selected ? SELECTED_PIN_COLOR : DEFAULT_PIN_COLOR,
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 1.5,
    scale: selected ? 2 : 1.4,
    anchor: new google.maps.Point(12, 22)
  };
}

// Pans to the selected place; separate component so useMap() can access the
// map instance created by <Map> below.
function PanToSelected({
  places,
  selectedPlaceId
}: {
  places: Place[];
  selectedPlaceId?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedPlaceId) return;
    const place = places.find((p) => p.id === selectedPlaceId);
    if (place) map.panTo({ lat: place.lat, lng: place.lng });
  }, [map, selectedPlaceId, places]);

  return null;
}

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
      <PanToSelected places={places} selectedPlaceId={selectedPlaceId} />

      {/* Blue "you are here" dot with halo — visually distinct from the
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

      {apiIsLoaded &&
        places.map((place) => {
          const isSelected = place.id === selectedPlaceId;
          return (
            <Marker
              key={place.id}
              position={{ lat: place.lat, lng: place.lng }}
              title={place.name}
              icon={pinIcon(isSelected)}
              zIndex={isSelected ? 998 : undefined}
              onClick={() => onSelectPlace?.(place.id)}
            />
          );
        })}
    </Map>
  );
}
