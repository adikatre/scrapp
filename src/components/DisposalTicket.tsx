"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Image as ImageIcon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocalDisposalGuide } from "@/components/LocalDisposalGuide";
import { ImageDetectionViewer } from "@/components/ImageDetectionViewer";
import type { ScanPreview } from "@/components/ScanComposer";
import { buildScanLocationsHref, getScanSourceLabel } from "@/lib/scanHistory";
import { getSanDiegoGuidance } from "@/lib/sanDiegoDisposal";
import type { ScanTicket } from "@/lib/types";

type Props = {
  ticket: ScanTicket;
  itemIndex: number;
  preview?: ScanPreview;
  onItemChange: (index: number) => void;
  onChoice: (value: string) => void;
  onScanAgain: () => void;
};

export function DisposalTicket({ ticket, itemIndex, preview, onItemChange, onChoice, onScanAgain }: Props) {
  const [showPhoto, setShowPhoto] = useState(false);
  const item = ticket.items[itemIndex];
  const choice = ticket.choices?.[itemIndex];
  const guide = getSanDiegoGuidance(item, choice);
  const localOnly = ticket.classifier?.source === "local";
  const primary = guide?.bin ?? item.bin ?? item.route;
  return (
    <article className="space-y-5 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      {ticket.items.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Select an item ({ticket.items.length})</legend>
          <div className="flex flex-wrap gap-2">
            {ticket.items.map((candidate, index) => (
              <Button key={index} type="button" size="sm" variant={index === itemIndex ? "default" : "outline"}
                aria-pressed={index === itemIndex} onClick={() => onItemChange(index)}>{candidate.name}</Button>
            ))}
          </div>
        </fieldset>
      )}
      <header>
        <p className="text-xs font-medium text-muted-foreground">{getScanSourceLabel(ticket.classifier)}</p>
        <h2 className="mt-1 break-words text-2xl font-semibold tracking-tight">{item.name}</h2>
        {item.material && item.material !== "unknown" && <p className="mt-1 text-sm text-muted-foreground">{item.material}</p>}
      </header>
      {guide ? (
        <LocalDisposalGuide guidance={guide} choice={choice} onChoice={onChoice} />
      ) : (
        <section aria-label="Suggested disposal route" className="space-y-2 rounded-xl border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground">Suggested destination</p>
          <h3 className="text-xl font-semibold">{primary || "Check with your waste hauler"}</h3>
          {item.caveats && <p className="whitespace-pre-line text-sm">{item.caveats}</p>}
        </section>
      )}
      {!localOnly && (
        <details className="rounded-lg border px-4 py-3 text-sm" open={!guide}>
          <summary className="cursor-pointer font-medium">Scan details</summary>
          <div className="mt-3 space-y-3 leading-relaxed">
            {guide && item.caveats && <p><strong>Item notes.</strong> {item.caveats}</p>}
            {ticket.guidance && <p className="whitespace-pre-line"><strong>Scan summary.</strong> {ticket.guidance}</p>}
            {item.confidence > 0 && <p>Estimated identification confidence: {Math.round(item.confidence * 100)}%</p>}
            {ticket.note && <p className="break-words"><strong>Your description.</strong> {ticket.note}</p>}
            {preview && <Button variant="outline" size="sm" onClick={() => setShowPhoto(true)}><ImageIcon /> View scanned photo</Button>}
          </div>
        </details>
      )}
      <footer className="flex flex-wrap gap-2">
        <Button asChild><Link href={buildScanLocationsHref(ticket, itemIndex)}>View disposal options <ArrowRight /></Link></Button>
        <Button variant="outline" onClick={onScanAgain}><RotateCcw /> Scan another item</Button>
      </footer>
      {preview && <ImageDetectionViewer open={showPhoto} onOpenChange={setShowPhoto} imageSrc={preview.url} prediction={preview.prediction} />}
    </article>
  );
}
