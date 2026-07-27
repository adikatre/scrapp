"use client";

import { ScanView } from "@/lib/features/scan/view";
import type { ScanTicket } from "@/lib/types";

interface MobileScanPageProps {
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
  isMobile: boolean;
}

export default function MobileScanPage({
  activeTicket,
  pastTickets,
  onScanComplete,
  onSelectTicket,
  onScanAgain,
  isMobile
}: MobileScanPageProps) {
  return (
    <ScanView
      activeTicket={activeTicket}
      pastTickets={pastTickets}
      onScanComplete={onScanComplete}
      onSelectTicket={onSelectTicket}
      onScanAgain={onScanAgain}
      isMobile={isMobile}
    />
  );
}
