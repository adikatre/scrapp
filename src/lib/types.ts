import type { DisposalDecision, IdentificationCandidate } from "@/lib/rules/types";

export type PredictionRoute =
  | "Recycle"
  | "Compost"
  | "E-Waste"
  | "Hazardous Waste"
  | "Bulky Items (Donate)"
  | "Landfill / Donate / Check rules"
  | "Single-Use Items"
  | "General Trash"
  | "City Infrastructure"
  | "Living Things";

export type PredictionRoutes = string;

export type ClassifiedItem = {
  name: string;
  material: string;
  route: PredictionRoutes;
  bin?: string;
  confidence: number;
  caveats: string;
  search_queries?: string[];
};

export type ClassifierMetadata = {
  model: string;
  source: string;
  fallback_used: boolean;
};

export type Detection = {
  bbox: [number, number, number, number];
  class_name: string;
  confidence: number;
  route: PredictionRoutes;
  /** Unique identifier for this detection */
  id?: string;
};

export type PredictionResult = {
  objects: string[];
  bin_totals: Record<string, number>;
  detections: Detection[];
  text?: string;
  items?: ClassifiedItem[];
  classifier?: ClassifierMetadata;
  /** Present for responses produced by the deterministic Next.js rules adapter. */
  decision?: DisposalDecision;
  identificationCandidates?: IdentificationCandidate[];
  requiresChoice?: boolean;
};

export type Place = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  googleMapsUri?: string;
  /** Google Places photo resource name (places/{id}/photos/{ref}) for thumbnails */
  photoName?: string;
  distanceMiles?: number;
  /** True for hand-curated drop-offs (not Google Places) — e.g. county programs */
  curated?: boolean;
  /** Present on curated entries so details can render without a Places lookup */
  phone?: string;
  /** Present on curated entries so details can render without a Places lookup */
  website?: string;
  /** Optional per-card prep note shown on curated entries */
  note?: string;
};

export type PlaceDetails = Place & {
  phone?: string;
  website?: string;
  rating?: number;
  openNow?: boolean;
  weekdayDescriptions?: string[];
};

export type SavedLocationPrefs = {
  lat: number;
  lng: number;
  label: string;
  category: string;
};

export type ScanTicketPayload = {
  image: string | null;
  note?: string;
  guidance: string;
  disposalRoute: string;
  bin?: string;
  itemName: string;
  searchQueries?: string[];
  inputMode?: "photo" | "upload" | "describe" | "barcode";
  decision?: DisposalDecision;
};

export type ScanTicket = {
  id: string;
  timestamp: Date;
} & ScanTicketPayload;
