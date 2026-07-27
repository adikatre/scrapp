import { useCallback, useEffect, useState } from "react";
import type { ScanTicket } from "@/lib/types";

const SCAN_HISTORY_STORAGE_KEY = "scrapp-scan-history";
const MAX_STORED_SCANS = 20;

function readStoredTickets(): ScanTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SCAN_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as ScanTicket[]).map((ticket) => ({
      ...ticket,
      timestamp: new Date(ticket.timestamp)
    }));
  } catch {
    return [];
  }
}

function saveStoredTickets(tickets: ScanTicket[]): void {
  if (typeof window === "undefined") return;
  const trimmed = tickets.slice(0, MAX_STORED_SCANS);
  try {
    localStorage.setItem(SCAN_HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    try {
      localStorage.setItem(
        SCAN_HISTORY_STORAGE_KEY,
        JSON.stringify(trimmed.map((ticket) => ({ ...ticket, image: null })))
      );
    } catch {
      // Still over quota; skip persisting this time
    }
  }
}

export interface UseScanSessionReturn {
  tickets: ScanTicket[];
  activeTicketId: string | null;
  hydrated: boolean;
  handleScanComplete: (payload: {
    image: string | null;
    note?: string;
    guidance: string;
    disposalRoute: string;
    bin?: string;
    itemName: string;
    searchQueries?: string[];
  }) => void;
  handleSelectTicket: (id: string) => void;
  handleScanAgain: () => void;
  activeTicket: ScanTicket | null;
  pastTickets: ScanTicket[];
}

export function useScanSession(): UseScanSessionReturn {
  const [tickets, setTickets] = useState<ScanTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTickets(readStoredTickets());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveStoredTickets(tickets);
  }, [tickets, hydrated]);

  const handleScanComplete = useCallback(
    (payload: {
      image: string | null;
      note?: string;
      guidance: string;
      disposalRoute: string;
      bin?: string;
      itemName: string;
      searchQueries?: string[];
    }) => {
      const ticket: ScanTicket = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        ...payload
      };
      setTickets((prevTickets) => [ticket, ...prevTickets]);
      setActiveTicketId(ticket.id);
    },
    []
  );

  const handleSelectTicket = useCallback((id: string) => {
    setActiveTicketId(id);
  }, []);

  const handleScanAgain = useCallback(() => {
    setActiveTicketId(null);
  }, []);

  const activeTicket = tickets.find((ticket) => ticket.id === activeTicketId) ?? null;
  const pastTickets = tickets.filter((ticket) => ticket.id !== activeTicketId);

  return {
    tickets,
    activeTicketId,
    hydrated,
    handleScanComplete,
    handleSelectTicket,
    handleScanAgain,
    activeTicket,
    pastTickets
  };
}
