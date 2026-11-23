"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { History } from "lucide-react";
import { DisposalTicket } from "@/components/DisposalTicket";
import { ScanComposer, type ScanPreview } from "@/components/ScanComposer";
import { ScanHistory } from "@/components/ScanHistory";
import { ScanHistorySheet } from "@/components/ScanHistorySheet";
import { buildScanHref, readStoredTickets, saveScan, SCAN_HISTORY_EVENT, setScanChoice } from "@/lib/scanHistory";
import type { ScanTicket } from "@/lib/types";

function ScanWorkspace() {
  const params = useSearchParams();
  const scanId = params.get("scan");
  const pick = params.get("pick") ?? "0";
  const [tickets, setTickets] = useState<ScanTicket[]>([]);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState<(ScanPreview & { id: string }) | null>(null);

  useEffect(() => {
    const sync = () => { setTickets(readStoredTickets()); setReady(true); };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(SCAN_HISTORY_EVENT, sync);
    window.addEventListener("pageshow", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SCAN_HISTORY_EVENT, sync);
      window.removeEventListener("pageshow", sync);
    };
  }, []);

  const itemIndex = /^(0|[1-9]\d*)$/.test(pick) ? Number(pick) : -1;
  const candidate = tickets.find((ticket) => ticket.id === scanId);
  const active = candidate?.items[itemIndex] ? candidate : undefined;
  const past = tickets.filter((ticket) => ticket.id !== active?.id);

  function select(id: string, index = 0) {
    window.history.replaceState(null, "", buildScanHref(id, index));
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-background via-background to-emerald-950/25 px-4 pt-24 pb-12 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{active ? "Your disposal guide" : "Sort an item"}</h1>
            {!active && <p className="mt-2 text-sm text-muted-foreground sm:text-base">Take a photo or describe an item for San Diego household disposal guidance.</p>}
          </div>
          <div className="lg:hidden"><ScanHistorySheet tickets={past} onSelect={select} /></div>
        </header>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
          {scanId && !ready ? (
            <p role="status" className="text-sm text-muted-foreground">Opening saved scan…</p>
          ) : active ? (
            <DisposalTicket ticket={active} itemIndex={itemIndex}
              preview={preview?.id === active.id ? preview : undefined}
              onItemChange={(index) => select(active.id, index)}
              onChoice={(value) => setScanChoice(active.id, itemIndex, value)}
              onScanAgain={() => { setPreview(null); window.history.replaceState(null, "", "/cam"); }} />
          ) : (
            <div>
              {scanId && <p role="status" className="mb-3 text-sm text-muted-foreground">This saved item is unavailable on this browser. You can start a new scan below.</p>}
              <ScanComposer onComplete={(ticket, image) => {
                saveScan(ticket);
                setPreview(image ? { ...image, id: ticket.id } : null);
                select(ticket.id);
              }} />
            </div>
          )}
          <aside aria-label="Scan history" className="hidden rounded-2xl border bg-card/60 p-4 lg:block">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><History className="size-4"/> Past scans</h2>
            <ScanHistory tickets={past} onSelect={select} />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function CamPage() {
  return <Suspense fallback={<p className="px-4 pt-24">Opening scanner…</p>}><ScanWorkspace /></Suspense>;
}
