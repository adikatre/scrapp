"use client";
import { Button } from "@/components/ui/button";
import {
  getCurbsideBinInfo,
  LOCATION_CATEGORIES,
  type LocationCategoryKey
} from "@/lib/locationCategories";
import { cn } from "@/lib/utils";

const CATEGORY_ACCENTS: Record<LocationCategoryKey, string> = {
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

export type CategoryTabsWidgetProps = {
  activeCategory: LocationCategoryKey;
  onCategoryChange: (category: LocationCategoryKey) => void;
  curbsideBin?: string | null;
  className?: string;
};

export function CategoryTabsWidget({
  activeCategory,
  onCategoryChange,
  curbsideBin,
  className
}: CategoryTabsWidgetProps) {
  const searchableCategories = LOCATION_CATEGORIES.filter((c) => c.searchable);
  const curbsideInfo = curbsideBin ? getCurbsideBinInfo(curbsideBin) : null;

  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="tablist"
      aria-label="Disposal categories">
      {searchableCategories.map((category) => {
        const isActive = activeCategory === category.key;
        const isCurbsideMatch = curbsideInfo?.categoryKey === category.key;
        const _accent = CATEGORY_ACCENTS[category.key];
        const Icon = category.icon;

        return (
          <Button
            key={category.key}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${category.key}`}
            id={`tab-${category.key}`}
            onClick={() => onCategoryChange(category.key)}
            variant={isActive ? "default" : "outline"}
            className={cn(
              "gap-1.5 transition-all duration-200",
              isActive && "shadow-sm",
              isCurbsideMatch && "ring-2 ring-offset-2 ring-primary"
            )}>
            <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "")} />
            <span>{category.label}</span>
            {isCurbsideMatch && (
              <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                Curbside
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
