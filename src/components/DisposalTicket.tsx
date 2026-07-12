"use client";

import Link from "next/link";
import { MapPin, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  buildLocationsHref,
  getCategoryByKey,
  resolveCategoryKey
} from "@/lib/locationCategories";
import { ScanTicket } from "@/lib/types";
import { cn } from "@/lib/utils";

// Mirrors the accent palette already used for waste categories on the
// homepage's "Lesser Known Recyclables" cards, mapped onto our category keys.
const CATEGORY_ACCENTS: Record<string, string> = {
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

function getCategoryAccent(key: string) {
  return CATEGORY_ACCENTS[key] ?? CATEGORY_ACCENTS.recycle;
}

// San Diego household bin chip colors, keyed by the backend's bin strings.
// The tint matches the physical curbside bin color.
const BIN_ACCENTS: Record<string, string> = {
  "Blue Bin (Recycling)": "bg-blue-500/15 text-blue-400 ring-blue-500/30",
  "Green Bin (Organics)": "bg-green-500/15 text-green-400 ring-green-500/30",
  "Gray Bin (Trash)": "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30",
  "Special Drop-off": "bg-amber-500/15 text-amber-400 ring-amber-500/30"
};

function BinChip({ bin }: { bin?: string }) {
  if (!bin) return null;
  const accent = BIN_ACCENTS[bin];
  if (!accent) return null;

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        accent
      )}>
      {bin}
    </span>
  );
}

interface DisposalTicketProps {
  ticket: ScanTicket;
  onImageClick?: (src: string) => void;
  onScanAgain?: () => void;
  compact?: boolean;
  /** Skip the embedded photo, e.g. when the ticket overlays that same photo already shown as a backdrop. */
  hideImage?: boolean;
  className?: string;
}

export function DisposalTicket({
  ticket,
  onImageClick,
  onScanAgain,
  compact,
  hideImage,
  className
}: DisposalTicketProps) {
  // The bin is San Diego's authoritative destination, so a curbside bin decides
  // the category even when the model's route disagrees (e.g. a pen tagged
  // "Donate" that actually goes in the gray trash bin).
  const categoryKey = resolveCategoryKey(ticket.disposalRoute, ticket.bin);
  const category = getCategoryByKey(categoryKey);
  const Icon = category?.icon ?? Sparkles;
  const accent = getCategoryAccent(categoryKey);
  const label = category?.label ?? (ticket.disposalRoute || "Unsorted");

  if (compact) {
    return (
      <div
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border border-muted/40 bg-muted/20 p-3",
          className
        )}>
        {ticket.image && (
          <img
            src={ticket.image}
            alt={ticket.itemName || "Past scan"}
            className="size-12 shrink-0 rounded-md border border-muted object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {ticket.itemName || "Unidentified item"}
          </p>
          <p className="text-xs text-muted-foreground">
            {ticket.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
            accent
          )}>
          <Icon className="size-3" />
          {label}
        </span>
      </div>
    );
  }

  return (
    <Card className={cn("flex flex-1 flex-col border-muted/40 shadow-lg", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg leading-snug">
            {ticket.itemName || "Scan result"}
          </CardTitle>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset",
              accent
            )}>
            <Icon className="size-4" />
            {label}
          </span>
        </div>
        <BinChip bin={ticket.bin} />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {!hideImage && ticket.image && (
          <img
            src={ticket.image}
            alt={ticket.itemName || "Scanned item"}
            onClick={() => ticket.image && onImageClick?.(ticket.image)}
            className={cn(
              "max-h-56 w-full rounded-lg border border-muted object-cover shadow-sm",
              onImageClick ? "cursor-pointer" : ""
            )}
          />
        )}
        {ticket.note && (
          <p className="text-sm italic text-muted-foreground">
            &ldquo;{ticket.note}&rdquo;
          </p>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {ticket.guidance}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button asChild className="flex-1">
          <Link
            href={buildLocationsHref(
              ticket.disposalRoute || "Recycle",
              ticket.itemName,
              ticket.searchQueries,
              ticket.bin
            )}>
            <MapPin className="size-4" />
            Find disposal locations
          </Link>
        </Button>
        <Button variant="outline" onClick={onScanAgain}>
          <RotateCcw className="size-4" />
          Scan again
        </Button>
      </CardFooter>
    </Card>
  );
}
