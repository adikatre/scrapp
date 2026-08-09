"use client";

import { AdvancedMarker, Map as GoogleMap, Pin, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo } from "react";
import type { Place } from "@/lib/types";

export type LocationMapWidgetProps = {
  places: Place[];
  userLat?: number;
  userLng?: number;
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
};

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
    const place = places.find((candidate) => candidate.id === selectedPlaceId);
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
  const center = useMemo(
    () =>
      userLat != null && userLng != null
        ? { lat: userLat, lng: userLng }
        : places[0]
          ? { lat: places[0].lat, lng: places[0].lng }
          : { lat: 32.7157, lng: -117.1611 },
    [userLat, userLng, places]
  );
  const mapKey = `${center.lat}-${center.lng}`;
  return (
    <GoogleMap
      key={mapKey}
      mapId="DEMO_MAP_ID"
      defaultCenter={center}
      defaultZoom={12}
      gestureHandling="cooperative"
      disableDefaultUI={false}
      style={{ width: "100%", height: "100%", minHeight: "300px" }}>
      <PanToSelected places={places} selectedPlaceId={selectedPlaceId} />
      {userLat != null && userLng != null && (
        <AdvancedMarker
          position={{ lat: userLat, lng: userLng }}
          title="Your location"
          zIndex={1000}>
          <span className="block size-4 rounded-full border-[3px] border-white bg-blue-500 shadow-md" />
        </AdvancedMarker>
      )}
      {places.map((place) => {
        const selected = place.id === selectedPlaceId;
        return (
          <AdvancedMarker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            title={place.name}
            zIndex={selected ? 100 : 10}
            onClick={() => onSelectPlace?.(place.id)}>
            <Pin
              background={selected ? "#167f78" : "#274642"}
              borderColor="#ffffff"
              glyphColor="#ffffff"
              scale={selected ? 1.22 : 1}
            />
          </AdvancedMarker>
        );
      })}
    </GoogleMap>
  );
}
