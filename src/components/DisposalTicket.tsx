"use client";

import { ExternalLink, MapPin, RotateCcw } from "lucide-react";
import Link from "next/link";
import { FeedbackControls } from "@/components/FeedbackControls";
import { Button } from "@/components/ui/button";
import { buildLocationsHref, getCategoryByKey, resolveCategoryKey } from "@/lib/locationCategories";
import type { ScanTicket } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DisposalTicketProps {
  ticket: ScanTicket;
  onImageClick?: (src: string) => void;
  onScanAgain?: () => void;
  compact?: boolean;
  hideImage?: boolean;
  demo?: boolean;
  className?: string;
}

function routeTone(bin?: string): string {
  if (bin?.startsWith("Blue")) return "route-ticket-blue";
  if (bin?.startsWith("Green")) return "route-ticket-green";
  if (bin?.startsWith("Gray")) return "route-ticket-gray";
  return "route-ticket-special";
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
  const label = category?.label ?? ticket.disposalRoute ?? "Local guidance";
  const answer = ticket.bin || label;

  if (compact) {
    return (
      <div
        className={cn(
          "group flex w-full items-center gap-3 border-b border-white/12 py-3 text-left",
          className
        )}>
        {ticket.image ? (
          <img
            src={ticket.image}
            alt={ticket.itemName || "Past scan"}
            className="size-12 shrink-0 object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{ticket.itemName || "Unidentified item"}</p>
          <p className="mt-1 text-xs text-white/50">
            {ticket.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span className="max-w-28 text-right text-xs font-semibold text-teal-200">{answer}</span>
      </div>
    );
  }

  return (
    <article className={cn("route-ticket flex flex-1 flex-col", className)}>
      <header className="route-ticket-heading">
        <p className="text-sm text-muted-foreground">{demo ? "Example" : "Looks like"}</p>
        <h2 className="route-display mt-1 text-2xl font-semibold leading-tight tracking-[-0.03em]">
          {ticket.itemName || "Scan result"}
        </h2>
      </header>

      {!hideImage && ticket.image ? (
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
            "route-ticket-image max-h-64 w-full object-cover",
            onImageClick && "cursor-pointer"
          )}
        />
      ) : null}

      {ticket.note ? (
        <p className="px-5 pt-4 text-sm italic text-muted-foreground">
          &ldquo;{ticket.note}&rdquo;
        </p>
      ) : null}

      <div className={cn("route-ticket-answer", routeTone(ticket.bin))}>
        <strong>{answer}</strong>
        <p>{ticket.guidance}</p>
      </div>

      {ticket.decision ? (
        <div className="route-ticket-details">
          {ticket.decision.safety.length ? (
            <section className="route-ticket-safety" aria-labelledby={`safety-${ticket.id}`}>
              <h3 id={`safety-${ticket.id}`} className="font-semibold">
                Safety
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {ticket.decision.safety.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <dl className="route-ticket-source">
            <div>
              <dt>Jurisdiction</dt>
              <dd>{ticket.decision.jurisdiction.municipality}</dd>
            </div>
            <div>
              <dt>Service</dt>
              <dd>{ticket.decision.serviceProfile.name}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>
                <a
                  href={ticket.decision.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-primary underline underline-offset-4">
                  {ticket.decision.source.title} <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Effective {ticket.decision.effectiveDate}. Last checked {ticket.decision.lastChecked}.
          </p>
          <FeedbackControls decision={ticket.decision} />
        </div>
      ) : null}

      {!demo ? (
        <footer className="route-ticket-actions">
          {category?.searchable ? (
            <Button asChild className="flex-1">
              <Link
                href={buildLocationsHref(
                  ticket.disposalRoute || "Recycle",
                  ticket.itemName,
                  ticket.searchQueries,
                  ticket.bin
                )}>
                <MapPin className="size-4" aria-hidden /> Find nearby
              </Link>
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={onScanAgain}
            className={category?.searchable ? "" : "flex-1"}>
            <RotateCcw className="size-4" aria-hidden /> Scan Again
          </Button>
        </footer>
      ) : null}
    </article>
  );
}
