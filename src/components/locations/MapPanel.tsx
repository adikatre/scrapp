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
    <section
      aria-label="Drop-off map"
      className="relative min-h-[58dvh] flex-1 overflow-hidden rounded-[20px] border border-border bg-muted/30 shadow-sm lg:h-full lg:min-h-0">
      {isSearchable ? (
        <LocationMapWidget
          places={places}
          userLat={userLat}
          userLng={userLng}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={onSelectPlace}
        />
      ) : (
        <div className="flex h-full min-h-72 items-center justify-center p-8 text-center">
          <div>
            <MapPin className="mx-auto size-9 text-muted-foreground" />
            <p className="mt-4 font-semibold">No map needed for this route</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Choose Recycling, E-Waste, Hazardous, Donation, or another searchable category to find
              a destination.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
