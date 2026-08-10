"use client";

import { useEffect, useState } from "react";
import { ScanView } from "@/components/ScanView";
import useMediaQuery from "@/hooks/useMediaQuery";
import { listScanTickets, saveScanTicket } from "@/lib/historyStore";
import type { ScanTicket, ScanTicketPayload } from "@/lib/types";

export default function CamPage() {
  const [tickets, setTickets] = useState<ScanTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const meetsQuery = useMediaQuery(800);

  useEffect(() => {
    void listScanTickets().then(setTickets);
  }, []);

  const handleScanComplete = (payload: ScanTicketPayload) => {
    const ticket: ScanTicket = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...payload
    };
    setTickets((previous) => [ticket, ...previous].slice(0, 20));
    setActiveTicketId(ticket.id);
    void saveScanTicket(ticket);
  };

  const activeTicket = tickets.find((ticket) => ticket.id === activeTicketId) ?? null;
  const pastTickets = tickets.filter((ticket) => ticket.id !== activeTicketId);

  return (
    <ScanView
      activeTicket={activeTicket}
      pastTickets={pastTickets}
      onScanComplete={handleScanComplete}
      onSelectTicket={setActiveTicketId}
      onScanAgain={() => setActiveTicketId(null)}
      isMobile={!meetsQuery}
    />
  );
}
