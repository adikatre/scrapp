import { buildLocationsHref } from "./locationCategories";
import { getSanDiegoGuidance } from "./sanDiegoDisposal";
import type { ClassifiedItem, ClassifierMetadata, PredictionResult, ScanTicket } from "./types";

const STORAGE_KEY = "scrapp-scan-history";
const HISTORY_LIMIT = 20;
export const SCAN_HISTORY_EVENT = "scrapp-history-updated";

// Keeps navigation usable in the same tab if the browser denies storage.
let sessionTickets: ScanTicket[] = [];
let lastStoredValue: string | null | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseItem(value: unknown): ClassifiedItem | null {
  if (!isRecord(value) || typeof value.name !== "string" || !value.name.trim()) return null;
  return {
    name: value.name,
    material: typeof value.material === "string" ? value.material : "",
    route: typeof value.route === "string" ? value.route : "",
    bin: typeof value.bin === "string" ? value.bin : undefined,
    confidence: typeof value.confidence === "number" ? value.confidence : 0,
    caveats: typeof value.caveats === "string" ? value.caveats : "",
    search_queries: Array.isArray(value.search_queries)
      ? value.search_queries.filter((query): query is string => typeof query === "string")
      : []
  };
}

function parseClassifier(value: unknown): ClassifierMetadata | undefined {
  if (!isRecord(value) || typeof value.source !== "string") return undefined;
  return {
    source: value.source,
    model: typeof value.model === "string" ? value.model : "",
    fallback_used: value.fallback_used === true,
    basis: ["image", "note", "image_and_note", "detections", "note_and_detections", "none"].includes(String(value.basis))
      ? value.basis as ClassifierMetadata["basis"] : undefined
  };
}

function parseTicket(raw: unknown): ScanTicket | null {
  if (!isRecord(raw) || typeof raw.id !== "string" || typeof raw.timestamp !== "string") return null;
  const timestamp = new Date(raw.timestamp);
  if (!Number.isFinite(timestamp.getTime())) return null;
  // Earlier tickets kept only the most confident item and a flattened summary.
  const values = Array.isArray(raw.items) ? raw.items : [{
    name: raw.itemName, route: raw.disposalRoute, bin: raw.bin, search_queries: raw.searchQueries
  }];
  const items = values.map(parseItem).filter((item): item is ClassifiedItem => item !== null);
  if (!items.length) return null;
  const choices: Record<number, string> = {};
  if (isRecord(raw.choices)) {
    items.forEach((_, index) => {
      const choice = (raw.choices as Record<string, unknown>)[index];
      if (typeof choice === "string") choices[index] = choice;
    });
  }
  return {
    id: raw.id, timestamp, items, choices, classifier: parseClassifier(raw.classifier),
    note: typeof raw.note === "string" ? raw.note : undefined,
    guidance: typeof raw.guidance === "string" ? raw.guidance : ""
  };
}

export function readStoredTickets(): ScanTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === lastStoredValue) return sessionTickets;
    let values: unknown = [];
    try {
      values = raw ? JSON.parse(raw) : [];
    } catch {
      // Ignore malformed storage rather than reviving an older cached ticket.
    }
    sessionTickets = Array.isArray(values)
      ? values.slice(0, HISTORY_LIMIT).map(parseTicket).filter((ticket): ticket is ScanTicket => ticket !== null)
      : [];
    lastStoredValue = raw;
    if (Array.isArray(values) && values.some((v) => isRecord(v) && "image" in v)) {
      // Migrate legacy photo-bearing history to text-only storage on first read.
      const migrated = JSON.stringify(sessionTickets);
      window.localStorage.setItem(STORAGE_KEY, migrated);
      lastStoredValue = migrated;
    }
  } catch {
    // Security restrictions or a damaged value should not block a new scan.
  }
  return sessionTickets;
}

function store(tickets: ScanTicket[]) {
  sessionTickets = tickets.slice(0, HISTORY_LIMIT);
  try {
    const newValue = JSON.stringify(sessionTickets);
    window.localStorage.setItem(STORAGE_KEY, newValue);
    lastStoredValue = newValue;
  } catch {
    // Keep the in-memory copy if persistence is unavailable.
  }
  window.dispatchEvent(new Event(SCAN_HISTORY_EVENT));
}

export function saveScan(ticket: ScanTicket) {
  const existing = readStoredTickets().filter((entry) => entry.id !== ticket.id);
  store([ticket, ...existing]);
}

export function setScanChoice(scanId: string, itemIndex: number, choice: string) {
  const tickets = readStoredTickets();
  if (!tickets.some((ticket) => ticket.id === scanId && ticket.items[itemIndex])) return;
  store(tickets.map((ticket) => ticket.id === scanId
    ? { ...ticket, choices: { ...ticket.choices, [itemIndex]: choice } }
    : ticket));
}

export function readScanHandoff(scanId: string | null, pick: string | null) {
  if (!scanId || (pick !== null && !/^(0|[1-9]\d*)$/.test(pick))) return null;
  const itemIndex = Number(pick ?? "0");
  const ticket = readStoredTickets().find((entry) => entry.id === scanId);
  const item = ticket?.items[itemIndex];
  return ticket && item ? { ticket, item, itemIndex } : null;
}

export function buildScanLocationsHref(ticket: ScanTicket, itemIndex: number) {
  const item = ticket.items[itemIndex];
  if (!item) return "/locations";
  const choice = ticket.choices?.[itemIndex];
  const guide = getSanDiegoGuidance(item, choice);
  const base = buildLocationsHref(
    guide?.route ?? item.route,
    item.name,
    guide?.searchQueries ?? item.search_queries,
    guide?.bin ?? item.bin
  );
  const params = new URLSearchParams(base.split("?")[1]);
  if (choice && guide?.question?.options.some((option) => option.value === choice)) {
    params.set("condition", choice);
  }
  params.set("scan", ticket.id);
  params.set("pick", String(itemIndex));
  return `/locations?${params}`;
}

export function buildScanHref(scanId: string, itemIndex: number) {
  return `/cam?${new URLSearchParams({ scan: scanId, pick: String(itemIndex) })}`;
}

export function createScanTicket(result: PredictionResult, note?: string): ScanTicket | null {
  const values = result.items ?? (result.detections ?? [])
    .filter((detection) => detection.class_name?.toLowerCase() !== "person")
    .map((detection) => ({ name: detection.class_name, route: detection.route, confidence: detection.confidence }));
  const items = values.map(parseItem).filter((item): item is ClassifiedItem => item !== null);
  if (!items.length) return null;
  return {
    id: crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join(""),
    timestamp: new Date(),
    note: note?.trim() || undefined,
    guidance: result.text?.trim() || "",
    items,
    classifier: parseClassifier(result.classifier) ?? (result.items ? undefined : {
      source: "yolo", model: "", fallback_used: true, basis: "detections"
    })
  };
}

export function getScanSourceLabel(classifier?: ClassifierMetadata): string {
  if (!classifier) return "Saved scan";
  if (classifier.source === "local") return "Local guide · typed item";
  if (classifier.fallback_used) return "Detection-only estimate";
  const provider = classifier.source === "adaption" ? "Adaption" :
    classifier.source === "openai" ? "OpenAI" : "Item analysis";
  const basis = { image: "photo", image_and_note: "photo and description", note: "description",
    detections: "detected objects", note_and_detections: "description and detected objects", none: "" };
  return classifier.basis && basis[classifier.basis] ? `${provider} · ${basis[classifier.basis]}` : provider;
}
