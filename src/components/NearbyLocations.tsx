"use client";

import { useEffect, useRef, useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { ChevronDown, ExternalLink, Navigation } from "lucide-react";
import { LocationSearchInput, type LocationSelection } from "./LocationSearchInput";
import { LocationsMap } from "./LocationsMap";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { searchPlaces, getPlaceDetails } from "@/lib/googlePlaces";
import { formatDistance, haversineDistance, readSavedLocationPrefs, saveLocationPrefs } from "@/lib/geo";
import type { LocationCategoryKey } from "@/lib/locationCategories";
import type { Place, PlaceDetails } from "@/lib/types";

type SearchArea = { label: string; lat?: number; lng?: number };
const centralSanDiego = { label: "Downtown San Diego", lat: 32.7157, lng: -117.1611 };
const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function PlaceCard({ place, selected, onSelect }: { place: Place; selected: boolean; onSelect: () => void }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<PlaceDetails | null>(place.curated ? place : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const destination = place.curated ? `${place.lat},${place.lng}` : `${place.name}, ${place.address}`;
  const params = new URLSearchParams({ api: "1", destination });
  if (!place.curated) params.set("destination_place_id", place.id);

  async function toggleDetails() {
    setOpen(!open);
    if (open || details || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await getPlaceDetails(place.id);
      setDetails(result.details);
      if (!result.details) setError("Contact details are unavailable. Check the listing before you go.");
    } catch {
      setError("Contact details could not be loaded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article id={`place-${place.id}`} onClick={onSelect}
      className={`scroll-mt-24 rounded-xl border bg-card px-4 py-4 ${selected ? "border-primary" : "border-border"}`}>
      <div className="flex items-start justify-between gap-2">
        {place.photoName && <img src={`/api/place-photo?name=${encodeURIComponent(place.photoName)}&w=128`}
          alt="" loading="lazy" decoding="async" className="size-14 shrink-0 rounded-md object-cover"
          onError={event => { event.currentTarget.hidden = true; }} />}
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">{place.curated ? "Collection program" : "Maps listing · call to confirm"}</p>
          <h3 className="font-semibold">{place.name}</h3>
          <p className="text-sm text-muted-foreground">{place.address}</p>
        </div>
        {place.distanceMiles != null && <span className="shrink-0 rounded bg-muted px-2 py-1 text-xs">{formatDistance(place.distanceMiles)}</span>}
      </div>
      {place.note && <p className="mt-2 text-sm leading-relaxed">{place.note}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><a href={`https://www.google.com/maps/dir/?${params}`} target="_blank" rel="noreferrer"><Navigation />Directions</a></Button>
        <Button type="button" variant="ghost" size="sm" onClick={toggleDetails} aria-expanded={open} disabled={busy}><ChevronDown />{busy ? "Loading…" : open ? "Hide details" : "Details"}</Button>
      </div>
      {open && <div className="mt-3 space-y-2 border-t pt-3 text-sm">
        {error && <p role="status">{error}</p>}
        {details?.openNow != null && <p>{details.openNow ? "Open now" : "Closed now"}</p>}
        {details?.phone && <p><a className="text-primary underline" href={`tel:${details.phone}`}>{details.phone}</a></p>}
        {details?.website && <a className="inline-flex items-center gap-1 text-primary underline" href={details.website} target="_blank" rel="noreferrer">Program website <ExternalLink size={13} /></a>}
        {details?.weekdayDescriptions?.map(day => <p key={day}>{day}</p>)}
        {details && !details.phone && !details.website && !details.weekdayDescriptions?.length && <p>Check hours and accepted items with the site before visiting.</p>}
      </div>}
    </article>
  );
}

export function NearbyLocations({ categoryKey, item, queries }: {
  categoryKey: LocationCategoryKey; item?: string; queries: string[];
}) {
  const [area, setArea] = useState<SearchArea>(() => readSavedLocationPrefs() ?? centralSanDiego);
  const [label, setLabel] = useState(area.label);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const locationRequest = useRef(0);
  const serializedQueries = JSON.stringify(queries);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setSelected(null);
    setFilter("");
    searchPlaces({ categoryKey, locationLabel: area.label, lat: area.lat, lng: area.lng,
      item, queries: JSON.parse(serializedQueries) })
      .then(({ places: results, error: problem }) => {
        if (!active) return;
        const { lat, lng } = area;
        const sorted = lat == null || lng == null ? results : results.map(place => ({
          ...place, distanceMiles: haversineDistance(lat, lng, place.lat, place.lng)
        })).sort((a, b) => a.distanceMiles - b.distanceMiles);
        setPlaces(sorted);
        setError(problem ?? "");
      }).catch(() => {
        if (active) { setPlaces([]); setError("The location search is temporarily unavailable."); }
      }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [area, categoryKey, item, serializedQueries]);

  function selectArea(next: SearchArea) {
    locationRequest.current++;
    setLocating(false);
    setLocationError("");
    setLabel(next.label);
    setArea(next);
    if (next.lat != null && next.lng != null) {
      saveLocationPrefs({ label: next.label, lat: next.lat, lng: next.lng, category: categoryKey });
    }
  }

  function locate() {
    if (!navigator.geolocation) { setLocationError("Enter your city or ZIP code to change the search area."); return; }
    const request = ++locationRequest.current;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(pos => {
      if (request === locationRequest.current) selectArea({ label: "Your location", lat: pos.coords.latitude, lng: pos.coords.longitude });
    }, () => {
      if (request !== locationRequest.current) return;
      setLocating(false);
      setLocationError("Location access is unavailable. Enter a city or ZIP code.");
    }, { maximumAge: 300000, timeout: 10000 });
  }

  async function submitArea(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const request = ++locationRequest.current;
    if (/^(?:downtown )?san diego(?:,? ca)?$/i.test(trimmed)) { selectArea(centralSanDiego); return; }
    if (typeof google !== "undefined" && google.maps?.Geocoder) {
      try {
        const { results } = await new google.maps.Geocoder().geocode({ address: trimmed, region: "us" });
        if (request !== locationRequest.current) return;
        const point = results[0]?.geometry.location;
        if (point) { selectArea({ label: results[0].formatted_address, lat: point.lat(), lng: point.lng() }); return; }
      } catch { /* Plain text can also scope a Places search. */ }
    }
    if (request === locationRequest.current) selectArea({ label: trimmed });
  }

  const filtered = places.filter(p => `${p.name} ${p.address}`.toLowerCase().includes(filter.trim().toLowerCase()));
  const coords = area.lat != null && area.lng != null ? { lat: area.lat, lng: area.lng } : null;
  const showMap = Boolean(mapsKey && !loading && filtered.length);
  const content = (
    <section className="mt-8 border-t pt-6" aria-label="Nearby drop-offs">
      <h2 className="text-xl font-semibold">Nearby drop-offs</h2>
      <p className="mb-3 mt-1 text-sm text-muted-foreground">Search area: {area.label}. Confirm the item type, condition and any appointment before a trip.</p>
      <LocationSearchInput value={label} onChange={setLabel} onSelectSuggestion={(s: LocationSelection) => selectArea(s)}
        onManualSubmit={submitArea} onUseMyLocation={locate} isLocating={locating} bias={coords} />
      {locationError && <p role="status" className="mt-2 text-sm">{locationError}</p>}
      <div className={`mt-4 grid items-start gap-4 ${showMap ? "lg:grid-cols-2" : ""}`}>
        {showMap && <div className="h-72 overflow-hidden rounded-xl lg:sticky lg:top-20 lg:order-last lg:h-[60vh]">
          <LocationsMap places={filtered} userLat={area.lat} userLng={area.lng} selectedPlaceId={selected}
            onSelectPlace={id => { setSelected(id); document.getElementById(`place-${id}`)?.scrollIntoView({ block: "nearest" }); }} />
        </div>}
        <div className="space-y-3">
          {loading ? <p role="status" className="text-sm text-muted-foreground">Looking up collection sites…</p> : <>
            {places.length > 0 && <Input aria-label="Filter locations" placeholder="Filter by name or address" value={filter} onChange={e => setFilter(e.target.value)} />}
            {filtered.map(p => <PlaceCard key={p.id} place={p} selected={p.id === selected} onSelect={() => setSelected(p.id)} />)}
            {!filtered.length && <p role="status" className="rounded-lg border p-4 text-sm">{error || (filter ? "No places match this filter." : "No matching sites were found here.")}{" "}
              {!filter && <a className="text-primary underline" href="https://wastefreesd.org/" target="_blank" rel="noreferrer">Search the WasteFreeSD directory</a>}</p>}
          </>}
        </div>
      </div>
    </section>
  );
  return mapsKey ? <APIProvider apiKey={mapsKey} libraries={["places"]}>{content}</APIProvider> : content;
}
