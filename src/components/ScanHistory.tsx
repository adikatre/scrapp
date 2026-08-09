"use client";

import { History } from "lucide-react";
import { DisposalTicket } from "@/components/DisposalTicket";
import type { ScanTicket } from "@/lib/types";

interface ScanHistoryProps {
  tickets: ScanTicket[];
  onSelect: (id: string) => void;
  emptyMessage?: string;
}

export function ScanHistory({
  tickets,
  onSelect,
  emptyMessage = "Completed scans will appear here on this device."
}: ScanHistoryProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-current/20 p-5 text-center text-muted-foreground">
        <History className="mx-auto size-5 opacity-70" />
        <p className="mt-3 text-sm leading-6">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="flex w-full flex-col gap-2">
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          type="button"
          onClick={() => onSelect(ticket.id)}
          className="w-full rounded-xl text-left transition-transform duration-120 active:scale-[0.99]">
          <DisposalTicket ticket={ticket} compact />
        </button>
      ))}
    </div>
  );
}
