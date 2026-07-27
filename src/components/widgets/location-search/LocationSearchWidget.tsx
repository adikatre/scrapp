"use client";

import { Loader2, LocateFixed, MapPin, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  autocompleteLocations,
  type LocationPrediction,
  resolveLocationPlace
} from "@/lib/googlePlaces";
import { cn } from "@/lib/utils";

const SUGGESTION_DEBOUNCE_MS = 300;

export type LocationSelection = {
  label: string;
  lat: number;
  lng: number;
};

export type LocationSearchWidgetProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (selection: LocationSelection) => void;
  onManualSubmit: (value: string) => void;
  onUseMyLocation: () => void;
  bias?: { lat: number; lng: number } | null;
  isLocating?: boolean;
  disabled?: boolean;
};

function newSessionToken(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function LocationSearchWidget({
  value,
  onChange,
  onSelectSuggestion,
  onManualSubmit,
  onUseMyLocation,
  bias,
  isLocating,
  disabled
}: LocationSearchWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef<string | null>(null);
  const fetchSeqRef = useRef(0);

  const [predictions, setPredictions] = useState<LocationPrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [_isResolving, setIsResolving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [noMatches, setNoMatches] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (input.trim().length < 2) {
        fetchSeqRef.current++;
        setIsFetching(false);
        setPredictions([]);
        setNoMatches(false);
        setFetchError(null);
        setIsOpen(false);
        return;
      }

      const seq = ++fetchSeqRef.current;
      setIsFetching(true);
      setFetchError(null);

      try {
        const result = await autocompleteLocations({
          query: input,
          sessionToken: sessionTokenRef.current ?? newSessionToken(),
          lat: bias?.lat,
          lng: bias?.lng
        });

        if (seq !== fetchSeqRef.current) return;

        if (result.predictions.length === 0) {
          setNoMatches(true);
          setPredictions([]);
        } else {
          setNoMatches(false);
          setPredictions(result.predictions);
        }
        setIsOpen(true);
      } catch (err) {
        if (seq !== fetchSeqRef.current) return;
        setFetchError(err instanceof Error ? err.message : "Failed to fetch suggestions");
        setPredictions([]);
      } finally {
        if (seq === fetchSeqRef.current) {
          setIsFetching(false);
        }
      }
    },
    [bias]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, SUGGESTION_DEBOUNCE_MS);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, predictions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && predictions[activeIndex]) {
          selectPrediction(predictions[activeIndex]);
        } else {
          onManualSubmit(value);
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const selectPrediction = async (prediction: LocationPrediction) => {
    setIsResolving(true);
    try {
      const place = await resolveLocationPlace(
        prediction.placeId,
        sessionTokenRef.current ?? undefined
      );
      if (place) {
        onSelectSuggestion({
          label: place.label,
          lat: place.lat,
          lng: place.lng
        });
        onChange(place.label);
      }
    } catch (_err) {
    } finally {
      setIsResolving(false);
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleFocus = () => {
    if (value.trim().length >= 2) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search location…"
          disabled={disabled}
          className="pl-10 pr-10"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
        )}
        {value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => onChange("")}
            aria-label="Clear">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto">
          {fetchError && <div className="p-3 text-sm text-destructive border-b">{fetchError}</div>}
          {noMatches && !fetchError && (
            <div className="p-3 text-sm text-muted-foreground">No matches found</div>
          )}
          {predictions.map((prediction, index) => (
            <button
              type="button"
              key={prediction.placeId}
              onClick={() => selectPrediction(prediction)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm transition-colors",
                "hover:bg-accent focus:bg-accent",
                activeIndex === index && "bg-accent"
              )}>
              <div className="font-medium">{prediction.mainText}</div>
              {prediction.secondaryText && (
                <div className="text-xs text-muted-foreground">{prediction.secondaryText}</div>
              )}
            </button>
          ))}
          {predictions.length === 0 && !noMatches && !fetchError && !isFetching && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Type to search…</div>
          )}
        </Card>
      )}

      <div className="flex gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onUseMyLocation}
          disabled={disabled || isLocating}
          className="flex-1">
          {isLocating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Locating…
            </>
          ) : (
            <>
              <LocateFixed className="mr-2 h-4 w-4" />
              Use my location
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
