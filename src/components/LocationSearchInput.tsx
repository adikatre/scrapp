"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LocateFixed, Loader2, MapPin, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTION_DEBOUNCE_MS = 300;

export type LocationSelection = {
  label: string;
  lat: number;
  lng: number;
};

type LocationSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (selection: LocationSelection) => void;
  /** Fallback for plain text (no suggestion picked), e.g. "downtown near the pier" */
  onManualSubmit: (value: string) => void;
  onUseMyLocation: () => void;
  /** Known coordinates used to bias suggestions toward nearby cities */
  bias?: { lat: number; lng: number } | null;
  isLocating?: boolean;
  disabled?: boolean;
};

export function LocationSearchInput({
  value,
  onChange,
  onSelectSuggestion,
  onManualSubmit,
  onUseMyLocation,
  bias,
  isLocating,
  disabled
}: LocationSearchInputProps) {
  const placesLib = useMapsLibrary("places");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null
  );

  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isResolving, setIsResolving] = useState(false);

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

  const fetchSuggestions = (input: string) => {
    if (!placesLib || input.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
    }

    placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input,
      sessionToken: sessionTokenRef.current,
      includedPrimaryTypes: ["locality", "postal_code"],
      region: "us",
      ...(bias
        ? {
            locationBias: {
              center: { lat: bias.lat, lng: bias.lng },
              radius: 50000
            }
          }
        : {})
    })
      .then(({ suggestions: results }) => {
        setSuggestions(results);
        setActiveIndex(-1);
        setIsOpen(results.length > 0);
      })
      .catch(() => {
        setSuggestions([]);
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    onChange(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchSuggestions(next),
      SUGGESTION_DEBOUNCE_MS
    );
  };

  const resolveSuggestion = async (
    suggestion: google.maps.places.AutocompleteSuggestion
  ) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;

    setIsResolving(true);
    setIsOpen(false);
    try {
      const place = prediction.toPlace();
      const { place: resolved } = await place.fetchFields({
        fields: ["location", "formattedAddress"]
      });

      if (resolved.location) {
        onSelectSuggestion({
          label: resolved.formattedAddress ?? prediction.text.text,
          lat: resolved.location.lat(),
          lng: resolved.location.lng()
        });
      }
    } finally {
      setIsResolving(false);
      // Session concluded once a place is resolved; start a fresh one next time.
      sessionTokenRef.current = null;
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen || suggestions.length === 0) return;
      setActiveIndex((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen || suggestions.length === 0) return;
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && activeIndex >= 0 && suggestions[activeIndex]) {
        resolveSuggestion(suggestions[activeIndex]);
      } else {
        setIsOpen(false);
        onManualSubmit(value);
      }
    }
  };

  const handleClear = () => {
    onChange("");
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Pin sits inside the input (absolute, with matching left padding) so
          the input's outer edges line up with the rest of the column. */}
      <div className="relative w-full">
        <MapPin
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={inputRef}
          value={value}
          placeholder="Enter city or zip code..."
          disabled={disabled}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          // Inline paddings so the pin and the clear/locate buttons never
          // collide with text even if Tailwind `px-3` wins the cascade.
          style={{ paddingLeft: "2.25rem", paddingRight: "5rem" }}
        />
        <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
          {isResolving ? (
            <Loader2 className="mx-2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Clear location"
                onClick={handleClear}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Use my location"
            disabled={isLocating || isResolving}
            onClick={onUseMyLocation}
          >
            {isLocating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LocateFixed className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <Card className="absolute z-20 mt-1 w-full overflow-hidden p-1 shadow-lg">
          {suggestions.map((suggestion, i) => {
            const prediction = suggestion.placePrediction;
            if (!prediction) return null;
            return (
              <button
                key={prediction.placeId}
                type="button"
                className={cn(
                  "flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                  i === activeIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/60"
                )}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => resolveSuggestion(suggestion)}
              >
                <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{prediction.text.text}</span>
              </button>
            );
          })}
        </Card>
      )}
    </div>
  );
}
