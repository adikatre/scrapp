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
    searchQuery: "household hazardous waste disposal facility {location}"
  },
  {
    key: "donation",
    label: "Donation",
    icon: Heart,
    backendRoutes: ["Bulky Items (Donate)", "Landfill / Donate / Check rules"],
    searchable: true,
    searchQuery: "donation center thrift store {location}"
  },
  {
    key: "single_use",
    label: "Single-Use",
    icon: Trash2,
    backendRoutes: ["Single-Use Items"],
    searchable: false,
    infoMessage:
      "Single-use items like utensils and bags usually go in your regular trash or can sometimes be recycled through store drop-off programs. No special facility is needed."
  },
  {
    key: "general_trash",
    label: "General Trash",
    icon: Trash2,
    backendRoutes: ["General Trash"],
    searchable: false,
    infoMessage:
      "This item belongs in your regular trash bin. No special drop-off location is required — just use your curbside garbage collection."
  },
  {
    key: "city_infra",
    label: "City Infrastructure",
    icon: Trash2,
    backendRoutes: ["City Infrastructure"],
    searchable: false,
    infoMessage:
      "City infrastructure items aren't household waste. Contact your local public works department if you need to report or dispose of these."
  },
  {
    key: "living_things",
    label: "Living Things",
    icon: Leaf,
    backendRoutes: ["Living Things"],
    searchable: false,
    infoMessage:
      "Living things aren't waste! If you found a lost pet or animal, contact your local animal control or shelter instead."
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

export function buildSearchQuery(
  category: LocationCategory,
  locationLabel: string
): string {
  const template = category.searchQuery ?? "recycling center {location}";
  return template.replace("{location}", `near ${locationLabel}`);
}

export function buildLocationsHref(
  route: string,
  itemName?: string
): string {
  const category = routeToCategoryKey(route);
  const params = new URLSearchParams({ category });
  if (itemName) params.set("item", itemName);
  return `/locations?${params.toString()}`;
}
