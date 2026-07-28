"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  getItemSubcategories,
  LOCATION_CATEGORIES,
  type LocationCategoryKey
} from "@/lib/locationCategories";

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
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 shrink-0">
      {LOCATION_CATEGORIES.map(({ key, label, icon: Icon }) => {
        const subcategories = getItemSubcategories(key);
        return (
          <div key={key} className="flex">
            <Button
              variant={activeCategory === key ? "default" : "outline"}
              onClick={() => onSelectCategory(key)}
              className={`flex-1 min-w-0 items-center gap-1.5 text-xs px-2 ${
                subcategories.length > 0 ? "rounded-r-none" : ""
              }`}
              size="sm">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </Button>
            {subcategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-l-none border-l-0 px-1.5"
                    aria-label={`${label} sub-categories`}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {subcategories.map((sub) => (
                    <DropdownMenuItem
                      key={sub.item}
                      onSelect={() => onSelectSubcategory(key, sub.item)}>
                      {sub.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      })}
    </div>
  );
}
