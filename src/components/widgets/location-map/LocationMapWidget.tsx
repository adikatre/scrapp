"use client";

import { Map as GoogleMap, Marker, useApiIsLoaded, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo } from "react";
import type { Place } from "@/lib/types";

export type LocationMapWidgetProps = {
  places: Place[];
  userLat?: number;
  userLng?: number;
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
};

const PIN_PATH =
  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z";

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

export function LocationMapWidget({
  places,
  userLat,
  userLng,
  selectedPlaceId,
  onSelectPlace
}: LocationMapWidgetProps) {
  const apiIsLoaded = useApiIsLoaded();

  const center = useMemo(
    () =>
      userLat != null && userLng != null
        ? { lat: userLat, lng: userLng }
        : places.length > 0
          ? { lat: places[0].lat, lng: places[0].lng }
          : { lat: 32.7157, lng: -117.1611 },
    [userLat, userLng, places]
  );

  const mapKey = useMemo(() => `${center.lat}-${center.lng}`, [center]);

  return (
    <GoogleMap
      key={mapKey}
      defaultCenter={center}
      defaultZoom={12}
      gestureHandling="greedy"
      disableDefaultUI={false}
      style={{ width: "100%", height: "100%", minHeight: "300px" }}>
      <PanToSelected places={places} selectedPlaceId={selectedPlaceId} />

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
              scale: 8,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2
            }}
          />
        </>
      )}

      {apiIsLoaded &&
        places.map((place) => (
          <Marker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            title={place.name}
            clickable={true}
            zIndex={place.id === selectedPlaceId ? 100 : 10}
            icon={pinIcon(place.id === selectedPlaceId)}
            onClick={() => onSelectPlace?.(place.id)}
          />
        ))}
    </GoogleMap>
  );
}
