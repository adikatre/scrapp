"use client";

import type { ScanTicket } from "@/lib/types";

type Props = { tickets: ScanTicket[]; onSelect: (id: string) => void };

export function ScanHistory({ tickets, onSelect }: Props) {
  if (!tickets.length) return <p className="text-sm text-muted-foreground">Your recent scans will appear here on this browser.</p>;
  return (
    <ul className="space-y-2">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <button type="button" onClick={() => onSelect(ticket.id)}
            className="w-full rounded-lg border bg-muted/20 p-3 text-left text-sm hover:bg-muted">
            <span className="block break-words font-medium">{ticket.items.map((item) => item.name).join(", ")}</span>
            <time dateTime={ticket.timestamp.toISOString()} className="mt-1 block text-xs text-muted-foreground">
              {ticket.timestamp.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </time>
          </button>
        </li>
      ))}
    </ul>
  );
}
