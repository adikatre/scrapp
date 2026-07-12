export type PredictionRoutes = string;

export type ClassifiedItem = {
  name: string;
  material: string;
  route: PredictionRoutes;
  /** San Diego household destination, e.g. "Blue Bin (Recycling)" */
  bin?: string;
  confidence: number;
  caveats: string;
  /** LLM-suggested Places text queries for this item (no location wording) */
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
};

export type PredictionResult = {
  objects: string[];
  bin_totals: Record<string, number>;
  detections: Detection[];
  text?: string;
  items?: ClassifiedItem[];
  classifier?: ClassifierMetadata;
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

export type ScanTicket = {
  id: string;
  image: string | null;
  note?: string;
  guidance: string;
  disposalRoute: string;
  /** San Diego household destination, e.g. "Blue Bin (Recycling)" */
  bin?: string;
  itemName: string;
  searchQueries?: string[];
  timestamp: Date;
};
