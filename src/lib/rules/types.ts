export type DisposalRoute =
  | "recycle"
  | "compost"
  | "trash"
  | "e-waste"
  | "hazardous-waste"
  | "donate"
  | "special-drop-off";

export type BinName =
  | "Blue Bin (Recycling)"
  | "Green Bin (Organics)"
  | "Gray Bin (Trash)"
  | "Special Drop-off";

export type RuleSource = {
  id: string;
  publisher: string;
  title: string;
  url: string;
  language: string;
  lastChecked: string;
  verification: "official" | "verified-partner";
};

export type Jurisdiction = {
  id: string;
  country: string;
  region: string;
  municipality: string;
  timezone: string;
  supportedLocales: string[];
  status: "supported" | "pilot" | "unsupported";
};

export type ServiceProfile = {
  id: string;
  jurisdictionId: string;
  name: string;
  propertyType: "city-serviced-home" | "multifamily-or-private" | "unknown";
  providerName?: string;
};

export type MaterialDefinition = {
  id: string;
  name: string;
  aliases: string[];
  packagingForms?: string[];
  hazards?: string[];
  translations?: Record<string, { name: string; aliases: string[] }>;
};

export type RuleScope =
  | { level: "service-profile"; ids: string[] }
  | { level: "municipality"; id: string }
  | { level: "region"; id: string }
  | { level: "country"; id: string };

export type MaterialRule = {
  id: string;
  materialId?: string;
  slug: string;
  materialName: string;
  aliases: string[];
  route: DisposalRoute;
  bin: BinName;
  instruction: string;
  preparation: string[];
  safety?: string[];
  exceptions?: string[];
  locationEligible: boolean;
  searchQueries?: string[];
  sourceId: string;
  jurisdictionId: string;
  serviceProfileIds?: string[];
  scope?: RuleScope;
  effectiveFrom: string;
  effectiveTo?: string;
  priority: number;
  status: "active" | "draft" | "expired";
};

export type PostalCoverage = { country: string; postalCodePattern: string };

export type JurisdictionBundle = {
  jurisdiction: Jurisdiction;
  serviceProfiles: ServiceProfile[];
  sources: RuleSource[];
  rules: MaterialRule[];
  postalCoverage: PostalCoverage[];
};

export type DisposalDecision = {
  id: string;
  materialId: string;
  materialName: string;
  itemName: string;
  route: DisposalRoute;
  bin: BinName;
  instruction: string;
  preparation: string[];
  safety: string[];
  exceptions: string[];
  locationEligible: boolean;
  searchQueries: string[];
  jurisdiction: Jurisdiction;
  serviceProfile: ServiceProfile;
  ruleVersion: string;
  source: RuleSource;
  effectiveDate: string;
  lastChecked: string;
  confidence?: number;
  coverage: "confirmed" | "unavailable";
};

export type IdentificationCandidate = {
  id: string;
  name: string;
  material: string;
  condition: string;
  packagingClues: string[];
  hazards: string[];
  confidence: number;
};
