"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Camera, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalDisposalGuide } from "@/components/LocalDisposalGuide";
import { MaterialShortcuts } from "@/components/MaterialShortcuts";
import { NearbyLocations } from "@/components/NearbyLocations";
import { getSanDiegoGuidance } from "@/lib/sanDiegoDisposal";
import { buildScanHref, buildScanLocationsHref, getScanSourceLabel, readScanHandoff, setScanChoice } from "@/lib/scanHistory";
import { getCategoryByKey, getCurbsideBinInfo, getItemSubcategories, LOCATION_CATEGORIES, resolveCategoryKey, sanitizeSearchQueries } from "@/lib/locationCategories";

const directory = "https://wastefreesd.org/";

function LocationsGuide({ query }: { query: string }) {
  const router = useRouter();
  const params = new URLSearchParams(query);
  const [handoff] = useState(() => readScanHandoff(params.get("scan"), params.get("pick")));
  const [choice, setChoice] = useState<string | undefined>(() =>
    handoff?.ticket.choices?.[handoff.itemIndex] ?? params.get("condition") ?? undefined);
  const name = handoff?.item.name ?? params.get("item")?.trim().slice(0, 160);
  const [lookup, setLookup] = useState("");
  const item = handoff?.item ?? (name ? { name } : undefined);
  const guide = item && getSanDiegoGuidance(item, choice);
  const bin = guide?.bin ?? handoff?.item.bin ?? params.get("bin");
  const route = guide?.route ?? handoff?.item.route;
  const legacyCategory = getCategoryByKey(params.get("category"));
  const category = route
    ? getCategoryByKey(resolveCategoryKey(route, bin))
    : legacyCategory ?? (!name ? getCategoryByKey("recycle") : undefined);
  const queries = guide?.searchQueries ?? handoff?.item.search_queries ?? sanitizeSearchQueries(params.getAll("q"));
  const curbside = getCurbsideBinInfo(bin);
  const unresolved = !guide && route === "Landfill / Donate / Check rules";
  const canSearch = category?.searchable && !curbside && !unresolved && (!guide || guide.searchQueries.length > 0);

  function choose(value: string) {
    setChoice(value);
    if (handoff) {
      setScanChoice(handoff.ticket.id, handoff.itemIndex, value);
      const ticket = { ...handoff.ticket, choices: { ...handoff.ticket.choices, [handoff.itemIndex]: value } };
      router.replace(buildScanLocationsHref(ticket, handoff.itemIndex), { scroll: false });
    } else {
      params.set("condition", value);
      router.replace(`/locations?${params}`, { scroll: false });
    }
  }

  function submitLookup(e: React.FormEvent) {
    e.preventDefault();
    if (lookup.trim()) router.push(`/locations?${new URLSearchParams({ item: lookup.trim() })}`);
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-5 pb-12 pt-24 sm:px-8">
      {name ? <>
        <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {handoff && <Link href={buildScanHref(handoff.ticket.id, handoff.itemIndex)} className="inline-flex items-center gap-1.5 text-primary"><ArrowLeft size={15} /> Back to scan</Link>}
          <Link href="/locations" className="text-muted-foreground underline underline-offset-4">Browse another item</Link>
        </div>
        <header className="mb-5">
          <p className="mb-1 text-sm text-muted-foreground">{handoff ? getScanSourceLabel(handoff.ticket.classifier) : "San Diego disposal guide"}</p>
          <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">{name}</h1>
          {handoff?.item.material && <p className="mt-1 text-sm text-muted-foreground">{handoff.item.material}</p>}
        </header>
        {handoff && handoff.ticket.items.length > 1 && (
          <label className="mb-4 flex flex-wrap items-center gap-2 text-sm">Item from this scan
            <select className="max-w-full rounded-md border bg-card p-2" value={handoff.itemIndex}
              onChange={e => router.push(buildScanLocationsHref(handoff.ticket, Number(e.target.value)))}>
              {handoff.ticket.items.map((entry, index) => <option key={index} value={index}>{index + 1}. {entry.name}</option>)}
            </select>
          </label>
        )}
        {guide ? <LocalDisposalGuide guidance={guide} choice={choice} onChoice={choose} /> :
          <section className="space-y-2 rounded-xl border bg-card p-5">
            <h2 className="text-xl font-semibold">{curbside ? `Suggested destination · ${bin}` : "Confirm the disposal route"}</h2>
            {handoff?.item.caveats && <p className="text-sm">{handoff.item.caveats}</p>}
            <p className="text-sm text-muted-foreground">Check the exact material and condition in the regional directory before disposing of it.</p>
            <a href={directory} target="_blank" rel="noreferrer" className="inline-block text-sm text-primary underline">Look up the item on WasteFreeSD ↗</a>
          </section>}
        {handoff && (handoff.ticket.note || handoff.ticket.guidance || handoff.item.caveats || handoff.item.confidence > 0) && (
          <details className="mt-4 rounded-xl border px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium">Original scan details</summary>
            <dl className="mt-3 space-y-3 leading-relaxed">
              {handoff.item.confidence > 0 && <div><dt className="text-muted-foreground">Estimated identification confidence</dt><dd>{Math.round(handoff.item.confidence * 100)}%</dd></div>}
              {handoff.ticket.note && <div><dt className="text-muted-foreground">Your description</dt><dd>{handoff.ticket.note}</dd></div>}
              {handoff.item.caveats && <div><dt className="text-muted-foreground">Item observation</dt><dd>{handoff.item.caveats}</dd></div>}
              {handoff.ticket.guidance && <div><dt className="text-muted-foreground">Whole-scan summary</dt><dd>{handoff.ticket.guidance}</dd></div>}
            </dl>
          </details>
        )}
      </> : <>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-primary"><MapPin size={16} /> San Diego</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Household disposal guide</h1>
        <form className="my-5 flex gap-2" onSubmit={submitLookup}>
          <Input value={lookup} maxLength={160} aria-label="Household item" placeholder="Enter an item, e.g. propane canister"
            onChange={e => setLookup(e.target.value)} />
          <Button type="submit" disabled={!lookup.trim()}><Search size={16} /> Look up</Button>
        </form>
        <MaterialShortcuts />
        <Link className="mt-4 inline-flex items-center gap-2 text-sm text-primary underline underline-offset-4" href="/cam"><Camera size={16} /> Scan or describe an item</Link>
        <label className="mt-8 block text-sm font-medium">Browse by category
          <select className="mt-2 block w-full rounded-md border bg-card p-2.5 text-sm"
            value={category?.key ?? "recycle"} onChange={e => router.push(`/locations?${e.target.value.startsWith("category=") ? e.target.value : new URLSearchParams({ category: e.target.value })}`)}>
            {LOCATION_CATEGORIES.map(group => <optgroup key={group.key} label={group.label}>
              <option value={group.key}>{group.label}</option>
              {getItemSubcategories(group.key).map(sub =>
                <option key={sub.item} value={new URLSearchParams({ category: group.key, item: sub.item }).toString()}>{sub.label}</option>)}
            </optgroup>)}
          </select>
        </label>
        {category && !category.searchable && <p className="mt-4 rounded-lg border p-4 text-sm">{category.infoMessage}</p>}
      </>}
      {canSearch && category && <NearbyLocations key={`${name}-${choice}-${category.key}`} categoryKey={category.key}
        item={guide?.lookupItem ?? name} queries={queries} />}
    </div>
  );
}

// History is device-local. Resolve it before starting a search so that a stale
// public link cannot trigger a generic search ahead of a saved condition.
function LocationsRoute() {
  const params = useSearchParams();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const query = params.toString();
  return ready ? <LocationsGuide key={query} query={query} /> : <LoadingGuide />;
}

function LoadingGuide() {
  return <p role="status" className="mx-auto max-w-4xl px-5 pt-24 text-muted-foreground">Opening disposal guide…</p>;
}

export default function LocationsPage() {
  return <Suspense fallback={<LoadingGuide />}><LocationsRoute /></Suspense>;
}
