"use client";

import { ExternalLink, MapPin, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { FeedbackControls } from "@/components/FeedbackControls";
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

function BinChip({ bin, demo = false }: { bin?: string; demo?: boolean }) {
  if (!bin) return null;
  const accent = demo ? "bg-amber-100 text-amber-950 ring-amber-300" : BIN_ACCENTS[bin];
  if (!accent) return null;
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
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
  hideImage?: boolean;
  demo?: boolean;
  className?: string;
}

export function DisposalTicket({
  ticket,
  onImageClick,
  onScanAgain,
  compact,
  hideImage,
  demo = false,
  className
}: DisposalTicketProps) {
  const categoryKey = resolveCategoryKey(ticket.disposalRoute, ticket.bin);
  const category = getCategoryByKey(categoryKey);
  const Icon = category?.icon ?? Sparkles;
  const accent = demo ? "bg-sky-100 text-sky-950 ring-sky-300" : getCategoryAccent(categoryKey);
  const label = category?.label ?? (ticket.disposalRoute || "Unsorted");

  if (compact) {
    return (
      <div
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border border-border/70 bg-card p-3",
          className
        )}>
        {ticket.image && (
          <img
            src={ticket.image}
            alt={ticket.itemName || "Past scan"}
            className="size-12 shrink-0 rounded-lg border border-border object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{ticket.itemName || "Unidentified item"}</p>
          <p className="text-xs text-muted-foreground">
            {ticket.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ring-1 ring-inset",
            accent
          )}>
          <Icon className="size-3" />
          {label}
        </span>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "flex flex-1 flex-col overflow-hidden rounded-[18px] border-border/70 shadow-lg",
        className
      )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {demo ? "Example result" : "Scan result"}
            </p>
            <CardTitle className="mt-1 text-lg leading-snug">
              {ticket.itemName || "Scan result"}
            </CardTitle>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
              accent
            )}>
            <Icon className="size-4" />
            {label}
          </span>
        </div>
        <BinChip bin={ticket.bin} demo={demo} />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {!hideImage && ticket.image && (
          <img
            src={ticket.image}
            alt={ticket.itemName || "Scanned item"}
            onClick={() => onImageClick?.(ticket.image as string)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onImageClick?.(ticket.image as string);
              }
            }}
            tabIndex={onImageClick ? 0 : undefined}
            role={onImageClick ? "button" : undefined}
            className={cn(
              "max-h-56 w-full rounded-xl border border-border object-cover shadow-sm",
              onImageClick && "cursor-pointer"
            )}
          />
        )}
        {ticket.note && (
          <p className="text-sm italic text-muted-foreground">&ldquo;{ticket.note}&rdquo;</p>
        )}
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            What to do
          </p>
          <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">
            {ticket.guidance}
          </p>
        </div>
        {ticket.decision && (
          <>
            {!!ticket.decision.safety.length && (
              <div className="rounded-xl bg-secondary p-4">
                <p className="text-sm font-semibold">Safety</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {ticket.decision.safety.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="border-t border-border/70 pt-4 text-sm">
              <p className="font-semibold">{ticket.decision.jurisdiction.municipality}</p>
              <p className="mt-1 text-muted-foreground">{ticket.decision.serviceProfile.name}</p>
              <a
                href={ticket.decision.source.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 font-semibold text-primary underline underline-offset-4">
                {ticket.decision.source.title} <ExternalLink className="size-3.5" />
              </a>
              <p className="mt-2 text-xs text-muted-foreground">
                Effective {ticket.decision.effectiveDate} · Last checked{" "}
                {ticket.decision.lastChecked}
              </p>
            </div>
            <FeedbackControls decision={ticket.decision} />
          </>
        )}
      </CardContent>
      {!demo && (
        <CardFooter className="flex flex-wrap gap-2 border-t border-border/70 pt-4">
          {category?.searchable && (
            <Button asChild className="flex-1">
              <Link
                href={buildLocationsHref(
                  ticket.disposalRoute || "Recycle",
                  ticket.itemName,
                  ticket.searchQueries,
                  ticket.bin
                )}>
                <MapPin className="size-4" /> Find nearby
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onScanAgain}
            className={category?.searchable ? "" : "flex-1"}>
            <RotateCcw className="size-4" /> Scan again
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
