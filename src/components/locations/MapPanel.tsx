import { MapPin } from "lucide-react";
import { LocationMapWidget } from "@/components/widgets/location-map";
import type { Place } from "@/lib/types";

interface MapPanelProps {
  places: Place[];
  userLat?: number;
  userLng?: number;
  selectedPlaceId?: string | null;
  onSelectPlace: (placeId: string) => void;
  isSearchable: boolean;
}

export function MapPanel({
  places,
  userLat,
  userLng,
  selectedPlaceId,
  onSelectPlace,
  isSearchable
}: MapPanelProps) {
  return (
    <div className="order-first lg:order-last h-[45vh] min-h-[280px] shrink-0 lg:h-auto lg:min-h-0 lg:shrink lg:flex-grow rounded-lg overflow-hidden relative shadow-lg">
      {isSearchable ? (
        <LocationMapWidget
          places={places}
          userLat={userLat}
          userLng={userLng}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={onSelectPlace}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-muted/20 p-8 text-center">
          <div>
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No map needed for this disposal type.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try a searchable category like Recycling, E-Waste, or Hazardous Waste.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
