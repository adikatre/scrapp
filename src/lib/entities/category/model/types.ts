import type {
  CurbsideBinInfo,
  LocationCategory,
  LocationCategoryKey
} from "@/lib/locationCategories";

export type { CurbsideBinInfo, LocationCategory, LocationCategoryKey };

export const CATEGORY_ACCENTS: Record<LocationCategoryKey, string> = {
  recycle: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  compost: "bg-lime-500/15 text-lime-400 ring-lime-500/30",
  e_waste: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
  hazardous: "bg-rose-500/15 text-rose-400 ring-rose-500/30",
  donation: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  single_use: "bg-orange-500/15 text-orange-400 ring-orange-500/30",
  general_trash: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30",
  city_infra: "bg-cyan-500/15 text-cyan-400 ring-cyan-500/30",
  living_things: "bg-teal-500/15 text-teal-400 ring-teal-500/30"
};

export const BIN_ACCENTS: Record<string, string> = {
  "Blue Bin (Recycling)": "bg-blue-500/15 text-blue-400 ring-blue-500/30",
  "Green Bin (Organics)": "bg-green-500/15 text-green-400 ring-green-500/30",
  "Gray Bin (Trash)": "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30",
  "Special Drop-off": "bg-amber-500/15 text-amber-400 ring-amber-500/30"
};

export function getCategoryAccent(key: LocationCategoryKey): string {
  return CATEGORY_ACCENTS[key] ?? CATEGORY_ACCENTS.recycle;
}

export function getBinAccent(bin: string): string | undefined {
  return BIN_ACCENTS[bin];
}
