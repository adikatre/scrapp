"use client";

import { MapPin, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BIN_ACCENTS,
  buildLocationsHref,
  getCategoryAccent,
  getCategoryByKey,
  resolveCategoryKey
} from "@/lib/locationCategories";
import type { ScanTicket } from "@/lib/types";
import { cn } from "@/lib/utils";

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
          <p className="truncate text-sm font-medium">{ticket.itemName || "Unidentified item"}</p>
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
          <CardTitle className="text-lg leading-snug">{ticket.itemName || "Scan result"}</CardTitle>
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
            onClick={() => onImageClick?.(ticket.image as string)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onImageClick?.(ticket.image as string);
              }
            }}
            tabIndex={onImageClick ? 0 : undefined}
            role={onImageClick ? "button" : undefined}
            className={cn(
              "max-h-56 w-full rounded-lg border border-muted object-cover shadow-sm",
              onImageClick ? "cursor-pointer" : ""
            )}
          />
        )}
        {ticket.note && (
          <p className="text-sm italic text-muted-foreground">&ldquo;{ticket.note}&rdquo;</p>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{ticket.guidance}</p>
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
