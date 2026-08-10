"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import {
  getItemSubcategories,
  LOCATION_CATEGORIES,
  type LocationCategoryKey
} from "@/lib/locationCategories";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  activeCategory: LocationCategoryKey;
  activeItem?: string | null;
  onSelectCategory: (key: LocationCategoryKey) => void;
  onSelectSubcategory: (key: LocationCategoryKey, item: string) => void;
}

export function CategoryTabs({
  activeCategory,
  activeItem,
  onSelectCategory,
  onSelectSubcategory
}: CategoryTabsProps) {
  const [open, setOpen] = useState(false);
  const active = LOCATION_CATEGORIES.find((category) => category.key === activeCategory);
  const ActiveIcon = active?.icon;
  const desktopOptions = LOCATION_CATEGORIES.flatMap((category) => [
    {
      value: `category:${category.key}`,
      categoryKey: category.key,
      item: null,
      label: category.label,
      icon: category.icon
    },
    ...getItemSubcategories(category.key).map((subcategory) => ({
      value: `item:${category.key}:${subcategory.item}`,
      categoryKey: category.key,
      item: subcategory.item,
      label: `${category.label} — ${subcategory.label}`,
      icon: category.icon
    }))
  ]);
  const selectedSubcategory = getItemSubcategories(activeCategory).find(
    (subcategory) => subcategory.item === activeItem
  );
  const desktopValue = selectedSubcategory
    ? `item:${activeCategory}:${selectedSubcategory.item}`
    : `category:${activeCategory}`;

  const selectCategory = (key: LocationCategoryKey) => {
    onSelectCategory(key);
    setOpen(false);
  };

  const selectSubcategory = (key: LocationCategoryKey, item: string) => {
    onSelectSubcategory(key, item);
    setOpen(false);
  };

  return (
    <>
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                {ActiveIcon && <ActiveIcon className="size-4" />}
                {active?.label ?? "Choose category"}
              </span>
              <SlidersHorizontal className="size-4 text-muted-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85dvh] rounded-t-[22px] pb-[env(safe-area-inset-bottom)]">
            <SheetHeader className="pr-12 text-left">
              <SheetTitle className="font-display text-xl">Choose a disposal category</SheetTitle>
              <SheetDescription>
                Pick the item route first. More specific options appear where they improve the
                search.
              </SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto px-4 pb-5">
              {LOCATION_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const selected = category.key === activeCategory;
                const subcategories = getItemSubcategories(category.key);
                return (
                  <div key={category.key} className="border-b border-border py-2 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => selectCategory(category.key)}
                      className={cn(
                        "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold",
                        selected && "bg-primary/10 text-primary"
                      )}>
                      <Icon className="size-5" />
                      <span className="flex-1">{category.label}</span>
                      {selected && <Check className="size-4" />}
                    </button>
                    {subcategories.length > 0 && (
                      <div className="ml-11 flex flex-wrap gap-2 pb-2">
                        {subcategories.map((sub) => (
                          <button
                            type="button"
                            key={sub.item}
                            onClick={() => selectSubcategory(category.key, sub.item)}
                            className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground">
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:block">
        <Select
          value={desktopValue}
          onValueChange={(value) => {
            const option = desktopOptions.find((candidate) => candidate.value === value);
            if (!option) return;
            if (option.item) onSelectSubcategory(option.categoryKey, option.item);
            else onSelectCategory(option.categoryKey);
          }}>
          <SelectTrigger
            aria-label="Disposal category"
            className="h-11 w-full rounded-[11px] bg-background px-4 shadow-none">
            <SelectValue placeholder="Choose a disposal category" />
          </SelectTrigger>
          <SelectContent className="w-[var(--radix-select-trigger-width)] rounded-xl">
            <SelectGroup>
              <SelectLabel>Disposal categories</SelectLabel>
              {desktopOptions
                .filter((option) => option.item === null)
                .map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value} className="min-h-10">
                      <Icon className="size-4" />
                      {option.label}
                    </SelectItem>
                  );
                })}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Specific items</SelectLabel>
              {desktopOptions
                .filter((option) => option.item !== null)
                .map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value} className="min-h-10">
                      <Icon className="size-4" />
                      {option.label}
                    </SelectItem>
                  );
                })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
