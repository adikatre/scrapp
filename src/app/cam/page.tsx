"use client";

import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileScanPage from "@/app/cam/MobileScanPage";
import DesktopScanPage from "@/app/cam/DesktopScanPage";
import useMediaQuery from "@/hooks/useMediaQuery";
import { ScanTicket } from "@/lib/types";

export default function CamPage() {
  const [tickets, setTickets] = useState<ScanTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const meetsQuery = useMediaQuery(1100);

  const handleScanComplete = function (payload: {
    image: string | null;
    note?: string;
    guidance: string;
    disposalRoute: string;
    itemName: string;
  }) {
    const ticket: ScanTicket = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      ...payload
    };
    setTickets((prevTickets) => [ticket, ...prevTickets]);
    setActiveTicketId(ticket.id);
  };

  const handleSelectTicket = function (id: string) {
    setActiveTicketId(id);
  };

  const handleScanAgain = function () {
    setActiveTicketId(null);
  };

  const activeTicket = tickets.find((ticket) => ticket.id === activeTicketId) ?? null;
  const pastTickets = tickets.filter((ticket) => ticket.id !== activeTicketId);

  if (!meetsQuery) {
    return (
      <MobileScanPage
        activeTicket={activeTicket}
        pastTickets={pastTickets}
        onScanComplete={handleScanComplete}
        onSelectTicket={handleSelectTicket}
        onScanAgain={handleScanAgain}
        isMobile={isMobile ?? true}
      />
    );
  }

  return (
    <DesktopScanPage
      activeTicket={activeTicket}
      pastTickets={pastTickets}
      onScanComplete={handleScanComplete}
      onSelectTicket={handleSelectTicket}
      onScanAgain={handleScanAgain}
    />
  );
}
