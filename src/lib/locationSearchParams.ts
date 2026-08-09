"use client";

import {
  getCurbsideBinInfo,
  isLocationCategoryKey,
  type LocationCategoryKey,
  sanitizeSearchQueries
} from "./locationCategories";

export interface LocationSearchParams {
  category: LocationCategoryKey;
  item: string | null;
  queries: string[];
  bin: string | null;
}

const DEFAULT_CATEGORY: LocationCategoryKey = "recycle";

function getParam(
  searchParams:
    | URLSearchParams
    | { get: (k: string) => string | null; getAll: (k: string) => string[] },
  key: string
): string | null {
  return searchParams.get?.(key) ?? null;
}

function getAllParams(
  searchParams:
    | URLSearchParams
    | { get: (k: string) => string | null; getAll: (k: string) => string[] },
  key: string
): string[] {
  return searchParams.getAll?.(key) ?? [];
}

export function decodeLocationSearchParams(
  searchParams:
    | URLSearchParams
    | { get: (k: string) => string | null; getAll: (k: string) => string[] }
): LocationSearchParams {
  const rawCategory = getParam(searchParams, "category");
  const category =
    rawCategory && isLocationCategoryKey(rawCategory) ? rawCategory : DEFAULT_CATEGORY;

  return {
    category,
    item: getParam(searchParams, "item"),
    queries: sanitizeSearchQueries(getAllParams(searchParams, "q")),
    bin: getCurbsideBinInfo(getParam(searchParams, "bin")) ? getParam(searchParams, "bin") : null
  };
}

export function encodeLocationSearchParams(params: Partial<LocationSearchParams>): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.category) sp.set("category", params.category);
  if (params.item) sp.set("item", params.item);
  if (params.bin) sp.set("bin", params.bin);
  if (params.queries?.length) {
    for (const q of sanitizeSearchQueries(params.queries)) {
      sp.append("q", q);
    }
  }
  return sp;
}

export function buildLocationSearchHref(params: Partial<LocationSearchParams>): string {
  const sp = encodeLocationSearchParams(params);
  return `/locations?${sp.toString()}`;
}

export function getDefaultLocationSearchParams(): LocationSearchParams {
  return {
    category: DEFAULT_CATEGORY,
    item: null,
    queries: [],
    bin: null
  };
}

export function mergeLocationSearchParams(
  current: LocationSearchParams,
  updates: Partial<LocationSearchParams>
): LocationSearchParams {
  return { ...current, ...updates };
}
