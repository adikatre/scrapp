import { LocationCategoryKey } from "./locationCategories";

const CATEGORY_CHIP_STYLES: Record<LocationCategoryKey, string> = {
  recycle: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  compost: "bg-lime-500/15 text-lime-400 ring-lime-500/30",
  e_waste: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
  hazardous: "bg-rose-500/15 text-rose-400 ring-rose-500/30",
  donation: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  single_use: "bg-muted text-muted-foreground ring-border",
  general_trash: "bg-muted text-muted-foreground ring-border",
  city_infra: "bg-muted text-muted-foreground ring-border",
  living_things: "bg-lime-500/15 text-lime-400 ring-lime-500/30"
};

export function getCategoryChipStyles(key: LocationCategoryKey): string {
  return CATEGORY_CHIP_STYLES[key];
}
