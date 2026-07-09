"use client";

import { DisposalTicket } from "@/components/DisposalTicket";
import { ScanTicket } from "@/lib/types";

interface ScanHistoryProps {
  tickets: ScanTicket[];
  onSelect: (id: string) => void;
  emptyMessage?: string;
}

/** Plain list of past scans, used inside either a sidebar or a sheet. */
export function ScanHistory({
  tickets,
  onSelect,
  emptyMessage = "Your past scans will show up here."
}: ScanHistoryProps) {
  if (tickets.length === 0) {
    return (
      <p className="px-1 text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          onClick={() => onSelect(ticket.id)}
          className="w-full text-left">
          <DisposalTicket ticket={ticket} compact />
        </button>
      ))}
    </div>
  );
}
