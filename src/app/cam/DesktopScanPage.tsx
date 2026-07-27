"use client";

import { ScanView } from "@/lib/features/scan/view";
import type { ScanTicket } from "@/lib/types";

interface DesktopScanPageProps {
  activeTicket: ScanTicket | null;
  pastTickets: ScanTicket[];
  onScanComplete: (payload: {
    image: string | null;
    note?: string;
    guidance: string;
    disposalRoute: string;
    bin?: string;
    itemName: string;
    searchQueries?: string[];
  }) => void;
  onSelectTicket: (id: string) => void;
  onScanAgain: () => void;
}

export default function DesktopScanPage({
  activeTicket,
  pastTickets,
  onScanComplete,
  onSelectTicket,
  onScanAgain
}: DesktopScanPageProps) {
  return (
    <ScanView
      activeTicket={activeTicket}
      pastTickets={pastTickets}
      onScanComplete={onScanComplete}
      onSelectTicket={onSelectTicket}
      onScanAgain={onScanAgain}
      isMobile={false}
    />
  );
}
