"use client";

import { Check, ChevronDown, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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
  onSelectCategory: (key: LocationCategoryKey) => void;
  onSelectSubcategory: (key: LocationCategoryKey, item: string) => void;
}

export function CategoryTabs({
  activeCategory,
  onSelectCategory,
  onSelectSubcategory
}: CategoryTabsProps) {
  const [open, setOpen] = useState(false);
  const active = LOCATION_CATEGORIES.find((category) => category.key === activeCategory);
  const ActiveIcon = active?.icon;

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                {ActiveIcon && <ActiveIcon className="size-4" />}
                {active?.label ?? "Category"}
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuLabel>Disposal category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {LOCATION_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const selected = category.key === activeCategory;
              const subcategories = getItemSubcategories(category.key);
              if (subcategories.length > 0) {
                return (
                  <DropdownMenuSub key={category.key}>
                    <DropdownMenuSubTrigger
                      className={selected ? "bg-primary/10 text-primary" : ""}>
                      <Icon className="size-4" />
                      {category.label}
                      <ChevronRight className="ml-auto size-4" />
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onSelect={() => onSelectCategory(category.key)}>
                        All {category.label}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {subcategories.map((sub) => (
                        <DropdownMenuItem
                          key={sub.item}
                          onSelect={() => onSelectSubcategory(category.key, sub.item)}>
                          {sub.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                );
              }
              return (
                <DropdownMenuItem
                  key={category.key}
                  onSelect={() => onSelectCategory(category.key)}
                  className={selected ? "bg-primary/10 text-primary" : ""}>
                  <Icon className="size-4" />
                  {category.label}
                  {selected && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
