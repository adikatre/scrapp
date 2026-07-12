import {
  Battery,
  Heart,
  Leaf,
  Recycle,
  AlertTriangle,
  Trash2,
  type LucideIcon
} from "lucide-react";
import { PredictionResult } from "./types";

export type LocationCategoryKey =
  | "recycle"
  | "compost"
  | "e_waste"
  | "hazardous"
  | "donation"
  | "single_use"
  | "general_trash"
  | "city_infra"
  | "living_things";

export type LocationCategory = {
  key: LocationCategoryKey;
  label: string;
  icon: LucideIcon;
  /** Backend route strings that map to this category */
  backendRoutes: string[];
  /** Whether this category triggers a Places search */
  searchable: boolean;
  /** Google Places text query template (use {location} placeholder) */
  searchQuery?: string;
  /**
   * Google results whose names match are dropped from generic category
   * searches — text search is fuzzy and returns adjacent-but-wrong business
   * types (e.g. scrap metal yards for "household hazardous waste").
   * Item-specific (LLM-grounded) query results are not filtered.
   */
  excludeResultPattern?: RegExp;
  /** Shown for non-searchable categories */
  infoMessage?: string;
};

export const LOCATION_CATEGORIES: LocationCategory[] = [
  {
    key: "recycle",
    label: "Recycling",
    icon: Recycle,
    backendRoutes: ["Recycle"],
    searchable: true,
    searchQuery: "recycling center drop-off {location}"
  },
  {
    key: "compost",
    label: "Compost",
    icon: Leaf,
    backendRoutes: ["Compost"],
    searchable: true,
    searchQuery: "compost drop-off facility {location}"
  },
  {
    key: "e_waste",
    label: "E-Waste",
    icon: Battery,
    backendRoutes: ["E-Waste"],
    searchable: true,
    searchQuery: "electronics recycling drop-off {location}"
  },
  {
    key: "hazardous",
    label: "Hazardous",
    icon: AlertTriangle,
    backendRoutes: ["Hazardous Waste"],
    searchable: true,
    searchQuery: "household hazardous waste disposal facility {location}",
    excludeResultPattern:
      /scrap metal|metal recycl|scrap yard|junk ?yard|auto salvage|auto parts|salvage yard|pawn/i
  },
  {
    key: "donation",
    label: "Donation",
    icon: Heart,
    backendRoutes: ["Bulky Items (Donate)", "Landfill / Donate / Check rules"],
    searchable: true,
    searchQuery: "donation center thrift store {location}",
    excludeResultPattern: /landfill|transfer station|dump\b/i
  },
  {
    key: "single_use",
    label: "Single-Use",
    icon: Trash2,
    backendRoutes: ["Single-Use Items"],
    searchable: false,
    infoMessage:
      "No special facility is needed. In San Diego, single-use items like plastic straws, utensils, bags, film and anything labeled 'compostable' or 'biodegradable' go in the gray trash bin."
  },
  {
    key: "general_trash",
    label: "General Trash",
    icon: Trash2,
    backendRoutes: ["General Trash"],
    searchable: false,
    infoMessage:
      "No special facility is needed. This item belongs in San Diego's gray trash bin. Electronics do not go in any curbside bin."
  },
  {
    key: "city_infra",
    label: "City Infrastructure",
    icon: Trash2,
    backendRoutes: ["City Infrastructure"],
    searchable: false,
    infoMessage:
      "Contact your local public works department if you need to report or dispose of these."
  },
  {
    key: "living_things",
    label: "Living Things",
    icon: Leaf,
    backendRoutes: ["Living Things"],
    searchable: false,
    infoMessage:
      "If you found a lost pet or animal, contact your local animal control or shelter instead."
  }
];

export const SEARCHABLE_CATEGORIES = LOCATION_CATEGORIES.filter(
  (c) => c.searchable
);

export function getCategoryByKey(
  key: string | null | undefined
): LocationCategory | undefined {
  if (!key) return undefined;
  return LOCATION_CATEGORIES.find((c) => c.key === key);
}

export function routeToCategoryKey(route: string): LocationCategoryKey {
  const match = LOCATION_CATEGORIES.find((c) =>
    c.backendRoutes.includes(route)
  );
  return match?.key ?? "recycle";
}

// City of San Diego household bin strings. Must stay in sync with the backend
// enum in scrapp-backend/final/categories.py (BIN_BLUE/GREEN/GRAY/SPECIAL/NONE).
export const BIN_BLUE = "Blue Bin (Recycling)";
export const BIN_GREEN = "Green Bin (Organics)";
export const BIN_GRAY = "Gray Bin (Trash)";
export const BIN_SPECIAL = "Special Drop-off";
export const BIN_NONE = "Not Applicable";

export type CurbsideBinInfo = {
  /** Category whose tab and (if any) drop-off search this bin maps to */
  categoryKey: LocationCategoryKey;
  /** Curbside note shown atop /locations. The bin is the real destination. */
  note: string;
  /** Bin-tinted classes for the note banner */
  accent: string;
};

// The three curbside bins collected at the curb. An item that lands here needs
// no drop-off trip, so the bin (not the route) is the authoritative destination.
const CURBSIDE_BINS: Record<string, CurbsideBinInfo> = {
  [BIN_BLUE]: {
    categoryKey: "recycle",
    note: "Good news! This goes in your blue recycling bin at home. Rinse it, let it dry, and keep it loose (no bags). Put the lid back on. You do not need to drive anywhere. If you want, you can drop it off at a place below.",
    accent: "border-blue-500/30 bg-blue-500/10"
  },
  [BIN_GREEN]: {
    categoryKey: "compost",
    note: "Good news! This goes in your green food and yard bin at home. You do not need to drive anywhere. If you want, you can drop it off at a place below.",
    accent: "border-green-500/30 bg-green-500/10"
  },
  [BIN_GRAY]: {
    categoryKey: "general_trash",
    note: "This goes in your gray trash bin at home. Just put it out with your normal trash. You do not need to drive anywhere. Never put batteries, bulbs, or electronics in any home bin.",
    accent: "border-zinc-500/30 bg-zinc-500/10"
  }
};

/** Curbside metadata for a bin, or undefined for Special Drop-off / non-bins. */
export function getCurbsideBinInfo(
  bin: string | null | undefined
): CurbsideBinInfo | undefined {
  if (!bin) return undefined;
  return CURBSIDE_BINS[bin];
}

/** Curbside bins override the route: they are collected at the curb, so the
 * bin decides the destination category (fixes route/bin mismatches, e.g. a pen
 * the model tags "Landfill / Donate" but drops in the gray trash bin). */
export function resolveCategoryKey(
  route: string,
  bin?: string | null
): LocationCategoryKey {
  return getCurbsideBinInfo(bin)?.categoryKey ?? routeToCategoryKey(route);
}

const NON_WASTE_ROUTES = ["Living Things", "City Infrastructure"];

function isWasteItem(item: { route: string }): boolean {
  return !NON_WASTE_ROUTES.includes(item.route);
}

function pickBestClassifiedItem(
  items: NonNullable<PredictionResult["items"]>
): (typeof items)[number] | undefined {
  if (items.length === 0) return undefined;

  const wasteItems = items
    .filter(isWasteItem)
    .sort((a, b) => b.confidence - a.confidence);
  if (wasteItems.length > 0) return wasteItems[0];

  return [...items].sort((a, b) => b.confidence - a.confidence)[0];
}

function pickBestRouteFromCounts(
  binTotals: Record<string, number>
): string {
  const wasteEntries = Object.entries(binTotals).filter(
    ([route]) => !NON_WASTE_ROUTES.includes(route)
  );
  const entries = wasteEntries.length > 0 ? wasteEntries : Object.entries(binTotals);

  let maxRoute = "";
  let maxCount = 0;
  for (const [route, count] of entries) {
    if (count > maxCount) {
      maxCount = count;
      maxRoute = route;
    }
  }
  return maxRoute;
}

function pickBestDetection(
  detections: PredictionResult["detections"]
): PredictionResult["detections"][number] | undefined {
  if (detections.length === 0) return undefined;

  const wasteDetections = detections.filter((detection) =>
    isWasteItem(detection)
  );
  if (wasteDetections.length > 0) return wasteDetections[0];

  return detections[0];
}

export function getDominantRoute(result: PredictionResult): string {
  const bestItem = result.items ? pickBestClassifiedItem(result.items) : undefined;
  if (bestItem) return bestItem.route;

  const bestRoute = pickBestRouteFromCounts(result.bin_totals);
  if (bestRoute) return bestRoute;

  const bestDetection = pickBestDetection(result.detections);
  if (bestDetection) return bestDetection.route;

  return "";
}

export function getDominantSearchQueries(result: PredictionResult): string[] {
  const bestItem = result.items ? pickBestClassifiedItem(result.items) : undefined;
  return bestItem?.search_queries ?? [];
}

export function getDominantBin(result: PredictionResult): string {
  const bestItem = result.items ? pickBestClassifiedItem(result.items) : undefined;
  return bestItem?.bin ?? "";
}

export function getDominantItemName(result: PredictionResult): string {
  const bestItem = result.items ? pickBestClassifiedItem(result.items) : undefined;
  if (bestItem) return bestItem.name;

  const bestDetection = pickBestDetection(result.detections);
  if (bestDetection) return bestDetection.class_name;

  if (result.objects.length > 0) {
    return result.objects[0];
  }
  return "";
}

/** Categories where the scanned item refines the Places search query */
const ITEM_QUERY_CATEGORIES: LocationCategoryKey[] = ["e_waste", "hazardous"];

type ItemQueryRule = {
  /** Case-insensitive substrings matched against the sanitized item name */
  keywords: string[];
  /** Places text query template (use {location} placeholder) */
  searchQuery: string;
  categories: LocationCategoryKey[];
};

const ITEM_QUERY_RULES: ItemQueryRule[] = [
  {
    keywords: ["battery", "batteries"],
    searchQuery: "battery recycling drop-off {location}",
    categories: ["e_waste", "hazardous"]
  },
  {
    keywords: ["light bulb", "lightbulb", "cfl", "fluorescent", "led bulb"],
    searchQuery: "light bulb recycling drop-off {location}",
    categories: ["e_waste", "hazardous"]
  },
  {
    keywords: ["paint", "varnish", "stain"],
    searchQuery: "paint disposal drop-off site {location}",
    categories: ["hazardous"]
  },
  {
    keywords: ["motor oil", "engine oil", "used oil", "antifreeze"],
    searchQuery: "used motor oil recycling drop-off {location}",
    categories: ["hazardous"]
  },
  {
    keywords: ["ink cartridge", "printer cartridge", "toner"],
    searchQuery: "ink cartridge recycling drop-off {location}",
    categories: ["e_waste"]
  },
  {
    keywords: ["phone", "smartphone", "cell phone", "tablet", "laptop"],
    searchQuery: "cell phone and electronics recycling drop-off {location}",
    categories: ["e_waste"]
  }
];

/** Item names arrive via a public URL param and feed a Places API query */
function sanitizeItemName(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40)
    .trim();
}

export const MAX_ITEM_SEARCH_QUERIES = 4;

/** Search queries arrive via public URL params ("q") and feed Places API queries */
export function sanitizeSearchQueries(
  raw: string[] | null | undefined
): string[] {
  if (!raw) return [];
  const queries: string[] = [];
  for (const entry of raw) {
    const query = entry
      .replace(/[^a-zA-Z0-9\s&'-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60)
      .trim();
    if (query && !queries.includes(query)) queries.push(query);
    if (queries.length >= MAX_ITEM_SEARCH_QUERIES) break;
  }
  return queries;
}

function resolveItemQueryTemplate(
  categoryKey: LocationCategoryKey,
  item: string | null | undefined
): string | undefined {
  if (!ITEM_QUERY_CATEGORIES.includes(categoryKey)) return undefined;

  const safeItem = sanitizeItemName(item);
  if (!safeItem) return undefined;

  const rule = ITEM_QUERY_RULES.find(
    (r) =>
      r.categories.includes(categoryKey) &&
      r.keywords.some((kw) => safeItem.includes(kw))
  );
  if (rule) return rule.searchQuery;

  return categoryKey === "hazardous"
    ? `${safeItem} disposal drop-off {location}`
    : `${safeItem} recycling drop-off {location}`;
}

export function itemAffectsSearch(
  categoryKey: LocationCategoryKey,
  item: string | null | undefined
): boolean {
  return resolveItemQueryTemplate(categoryKey, item) !== undefined;
}

/**
 * When locationLabel is null the caller has real coordinates and relies on
 * locationBias instead of "near ..." text (which anchors results to the
 * label's geocode — or is junk when the label is "Your location").
 */
export function buildSearchQuery(
  category: LocationCategory,
  locationLabel: string | null,
  item?: string | null
): string {
  const template =
    resolveItemQueryTemplate(category.key, item) ??
    category.searchQuery ??
    "recycling center {location}";
  return template
    .replace("{location}", locationLabel ? `near ${locationLabel}` : "")
    .trim();
}

export function buildLocationsHref(
  route: string,
  itemName?: string,
  searchQueries?: string[],
  bin?: string | null
): string {
  const category = resolveCategoryKey(route, bin);
  const params = new URLSearchParams({ category });
  if (itemName) params.set("item", itemName);
  // Pass the curbside bin so /locations can surface the "toss it at the curb"
  // note; only curbside bins are recognized, so Special Drop-off is omitted.
  if (getCurbsideBinInfo(bin)) params.set("bin", bin as string);
  for (const q of sanitizeSearchQueries(searchQueries)) {
    params.append("q", q);
  }
  return `/locations?${params.toString()}`;
}
