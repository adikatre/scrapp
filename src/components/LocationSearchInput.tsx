"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  autocompleteLocations,
  resolveLocationPlace,
  type LocationPrediction
} from "@/lib/googlePlaces";
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

function newSessionToken(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/**
 * City/zip autocomplete backed by the server-side Places API (via server
 * actions) rather than the browser Maps JS SDK — the dropdown works even if
 * the public Maps key lacks Places (New) access, and failures surface as a
 * visible message instead of an empty dropdown.
 */
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef<string | null>(null);
  // Monotonic id so late responses from superseded fetches are discarded —
  // otherwise fast typing can show suggestions for an older query.
  const fetchSeqRef = useRef(0);

  const [predictions, setPredictions] = useState<LocationPrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isResolving, setIsResolving] = useState(false);
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

  const fetchSuggestions = async (input: string) => {
    if (input.trim().length < 2) {
      fetchSeqRef.current++;
      setIsFetching(false);
      setPredictions([]);
      setNoMatches(false);
      setFetchError(null);
      setIsOpen(false);
      return;
    }

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = newSessionToken();
    }

    const seq = ++fetchSeqRef.current;
    setIsFetching(true);

    const { predictions: results, error } = await autocompleteLocations({
      query: input,
      sessionToken: sessionTokenRef.current,
      lat: bias?.lat,
      lng: bias?.lng
    });

    if (seq !== fetchSeqRef.current) return;
    setIsFetching(false);
    setPredictions(results);
    setActiveIndex(-1);
    setFetchError(error ?? null);
    setNoMatches(!error && results.length === 0);
    setIsOpen(true);
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

  const resolvePrediction = async (prediction: LocationPrediction) => {
    setIsResolving(true);
    setIsOpen(false);
    try {
      const resolved = await resolveLocationPlace(
        prediction.placeId,
        sessionTokenRef.current ?? undefined
      );

      if (resolved) {
        onSelectSuggestion({
          label: resolved.label || prediction.text,
          lat: resolved.lat,
          lng: resolved.lng
        });
      } else {
        // Couldn't geocode the pick — fall back to a text search on its name.
        onChange(prediction.text);
        onManualSubmit(prediction.text);
      }
    } finally {
      setIsResolving(false);
      // Session concluded once a place is resolved; start a fresh one next time.
      sessionTokenRef.current = null;
      setPredictions([]);
      setNoMatches(false);
      setFetchError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen || predictions.length === 0) return;
      setActiveIndex((i) => (i + 1) % predictions.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen || predictions.length === 0) return;
      setActiveIndex((i) => (i <= 0 ? predictions.length - 1 : i - 1));
      return;
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      // Default to the top suggestion so "palm springs" + Enter selects the
      // real city instead of falling back to a fuzzy plain-text search.
      const pick =
        isOpen && predictions.length > 0
          ? predictions[Math.max(activeIndex, 0)]
          : null;
      if (pick) {
        resolvePrediction(pick);
      } else {
        setIsOpen(false);
        onManualSubmit(value);
      }
    }
  };

  const handleClear = () => {
    fetchSeqRef.current++;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onChange("");
    setPredictions([]);
    setNoMatches(false);
    setFetchError(null);
    setIsFetching(false);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const showDropdown =
    isOpen && (predictions.length > 0 || noMatches || fetchError);

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
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          // Inline paddings so the pin and the clear/locate buttons never
          // collide with text even if Tailwind `px-3` wins the cascade.
          style={{ paddingLeft: "2.25rem", paddingRight: "5rem" }}
        />
        <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
          {isResolving || isFetching ? (
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

      {showDropdown && (
        <Card className="absolute z-20 mt-1 w-full overflow-hidden p-1 shadow-lg">
          {fetchError && (
            <p className="px-2 py-1.5 text-sm text-destructive">{fetchError}</p>
          )}
          {noMatches && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              No matching locations — press Enter to search anyway.
            </p>
          )}
          {predictions.map((prediction, i) => (
            <button
              key={prediction.placeId}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                i === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/60"
              )}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => resolvePrediction(prediction)}
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">
                <span className="font-medium">{prediction.mainText}</span>
                {prediction.secondaryText && (
                  <span className="text-muted-foreground">
                    {" "}
                    {prediction.secondaryText}
                  </span>
                )}
              </span>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
