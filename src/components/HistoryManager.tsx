"use client";

import { Clock3, Download, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DisposalTicket } from "@/components/DisposalTicket";
import { Button } from "@/components/ui/button";
import { clearScanTickets, deleteScanTicket, listScanTickets } from "@/lib/historyStore";
import type { ScanTicket } from "@/lib/types";

export function HistoryManager() {
  const [tickets, setTickets] = useState<ScanTicket[]>([]);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void listScanTickets().then((records) => {
      setTickets(records);
      setLoaded(true);
    });
  }, []);

  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return tickets;
    return tickets.filter((ticket) =>
      [ticket.itemName, ticket.disposalRoute, ticket.bin, ticket.note]
        .filter(Boolean)
        .some((field) => field?.toLowerCase().includes(value))
    );
  }, [query, tickets]);

  const remove = async (id: string) => {
    await deleteScanTicket(id);
    setTickets((current) => current.filter((ticket) => ticket.id !== id));
  };

  const clear = async () => {
    if (!window.confirm("Delete all saved scans from this device? This cannot be undone.")) return;
    await clearScanTickets();
    setTickets([]);
  };

  const download = () => {
    const payload = tickets.map(({ image: _image, ...ticket }) => ticket);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    );
    link.download = "scrapp-history.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!loaded) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading saved scans">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-[14px] bg-muted" />
        ))}
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="max-w-xl py-12">
        <Clock3 className="size-9 text-primary" />
        <h2 className="font-display mt-5 text-2xl font-semibold">Your decisions will stay here.</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Scan or describe an item to save its result locally. An account is not required.
        </p>
        <Button asChild className="mt-6">
          <a href="/cam">Start a scan</a>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <span className="sr-only">Search history</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search items, bins, or notes"
            className="min-h-11 w-full rounded-xl border bg-card pl-10 pr-4 text-sm"
          />
        </label>
        <Button variant="outline" onClick={download}>
          <Download className="size-4" /> Export metadata
        </Button>
        <Button variant="outline" onClick={() => void clear()}>
          <Trash2 className="size-4" /> Clear all
        </Button>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        {visible.length} {visible.length === 1 ? "saved decision" : "saved decisions"}
      </p>
      <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
        {visible.map((ticket) => (
          <div key={ticket.id} className="grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-start">
            <DisposalTicket ticket={ticket} compact className="border-0 bg-transparent p-0" />
            <Button variant="ghost" size="sm" onClick={() => void remove(ticket.id)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
        ))}
      </div>
      {!visible.length && (
        <p className="py-12 text-center text-muted-foreground">
          No saved decisions match that search.
        </p>
      )}
    </div>
  );
}
