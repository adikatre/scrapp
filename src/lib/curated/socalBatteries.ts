import type { LocationCategoryKey } from "../locationCategories";
import type { Place } from "../types";
import { isWithinBounds, type GeoBounds } from "./geo";
import { resolveDropoffKind } from "./items";
import RECORDS from "./socalBatteries.data.json";
import type { CuratedMatchInput, CuratedProvider } from "./types";

/**
 * Battery Network (batterynetwork.org) drop-off sites across Southern
 * California, modeled as curated {@link CuratedProvider}s like the San Diego
 * library program. The data is a static snapshot (scraped July 2026) generated
 * from socal_battery_locations_live.csv into ./socalBatteries.data.json.
 *
 * Do not hand-edit the JSON — regenerate it with `npm run data:batteries`
 * (wraps generate_socal_batteries_json.py at the repo root).
 *
 * Sites are split into two providers by what they accept, so a household
 * battery search never routes someone to a bike shop that only takes e-bike
 * packs: each provider gates on its own item wording via `matches`.
 */

type SiteRecord = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  materials: string[];
  lat: number;
  lng: number;
  county: string;
};

const SITES = RECORDS as SiteRecord[];

const BATTERY_NETWORK_WEBSITE = "https://batterynetwork.org/locator/";

/** Friendly card wording for each Battery Network materials code. */
const MATERIAL_LABELS: Record<string, string> = {
  rechargeable: "rechargeable batteries",
  singleuse: "single-use batteries",
  cellphones: "cell phones",
  highenergybattery: "high-energy batteries",
  ebike: "e-bike batteries"
};

/** Canonical label order so notes read consistently across sites. */
const MATERIAL_ORDER = [
  "rechargeable",
  "singleuse",
  "highenergybattery",
  "ebike",
  "cellphones"
];

function buildNote(materials: string[]): string {
  const labels = MATERIAL_ORDER.filter((m) => materials.includes(m)).map(
    (m) => MATERIAL_LABELS[m]
  );
  return `Accepts: ${labels.join(", ")}. Tape battery terminals before drop-off.`;
}

function toPlace(site: SiteRecord): Place {
  return {
    id: site.id,
    name: site.name,
    address: site.address,
    lat: site.lat,
    lng: site.lng,
    phone: site.phone,
    curated: true,
    note: buildNote(site.materials),
    website: BATTERY_NETWORK_WEBSITE
  };
}

const HOUSEHOLD_MATERIALS = new Set(["rechargeable", "singleuse", "cellphones"]);
const EBIKE_MATERIALS = new Set(["ebike", "highenergybattery"]);
const CELLPHONE_MATERIALS = new Set(["cellphones"]);

function acceptsAny(site: SiteRecord, wanted: Set<string>): boolean {
  return site.materials.some((m) => wanted.has(m));
}

const HOUSEHOLD_PLACES: Place[] = SITES.filter((s) =>
  acceptsAny(s, HOUSEHOLD_MATERIALS)
).map(toPlace);

const EBIKE_PLACES: Place[] = SITES.filter((s) =>
  acceptsAny(s, EBIKE_MATERIALS)
).map(toPlace);

/**
 * Narrower than the household set on purpose: a store with a battery bucket does
 * not necessarily take a whole handset, so a phone only goes to sites that
 * explicitly collect them.
 */
const CELLPHONE_PLACES: Place[] = SITES.filter((s) =>
  acceptsAny(s, CELLPHONE_MATERIALS)
).map(toPlace);

/** Rough bounding box covering the swept SoCal counties. */
const SOCAL_BOUNDS: GeoBounds = {
  minLat: 32.4,
  maxLat: 35.9,
  minLng: -121.4,
  maxLng: -115.4
};

/** Counties in the snapshot, used as the label fallback when coords are absent. */
const COUNTY_LABEL_PATTERN =
  /san diego|los angeles|orange|riverside|san bernardino|ventura|santa barbara|san luis obispo|kern|imperial/i;

/** Battery disposal is routed to these categories by the classifier/frontend. */
const CATEGORY_KEYS: LocationCategoryKey[] = ["hazardous", "e_waste"];

function isInSocal(input: CuratedMatchInput): boolean {
  if (!CATEGORY_KEYS.includes(input.categoryKey)) return false;

  if (input.lat != null && input.lng != null) {
    return isWithinBounds(input.lat, input.lng, SOCAL_BOUNDS);
  }

  return COUNTY_LABEL_PATTERN.test(input.locationLabel ?? "");
}

export const socalHouseholdBatteryProgram: CuratedProvider = {
  id: "socal-battery-network-household",
  name: "Battery Network: SoCal household battery drop-off",
  matches: (input) =>
    isInSocal(input) && resolveDropoffKind(input) === "household",
  places: HOUSEHOLD_PLACES,
  nearestLimit: 25
};

export const socalCellphoneProgram: CuratedProvider = {
  id: "socal-battery-network-cellphone",
  name: "Battery Network: SoCal cell phone drop-off",
  matches: (input) =>
    isInSocal(input) && resolveDropoffKind(input) === "cellphone",
  places: CELLPHONE_PLACES,
  nearestLimit: 25
};

export const socalEbikeBatteryProgram: CuratedProvider = {
  id: "socal-battery-network-ebike",
  name: "Battery Network: SoCal e-bike battery drop-off",
  matches: (input) => isInSocal(input) && resolveDropoffKind(input) === "ebike",
  places: EBIKE_PLACES,
  nearestLimit: 25
};
