import type {
  Jurisdiction,
  JurisdictionBundle,
  MaterialDefinition,
  MaterialRule,
  RuleSource,
  ServiceProfile
} from "./types";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export class MaterialCatalog {
  private readonly byId: Map<string, MaterialDefinition>;

  constructor(private readonly materials: MaterialDefinition[]) {
    this.byId = new Map(materials.map((material) => [material.id, material]));
    if (this.byId.size !== materials.length)
      throw new Error("Material catalog contains duplicate IDs");
    const aliases = new Map<string, string>();
    for (const material of materials) {
      for (const value of [material.id, material.name, ...material.aliases]) {
        const key = normalize(value);
        const existing = aliases.get(key);
        if (existing && existing !== material.id)
          throw new Error(`Material alias conflict: ${value}`);
        aliases.set(key, material.id);
      }
    }
  }

  get(id: string) {
    return this.byId.get(id) ?? null;
  }

  list() {
    return [...this.materials].sort((a, b) => a.name.localeCompare(b.name));
  }

  search(query: string, limit = 8) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];
    return this.materials
      .map((material) => {
        const values = [material.id, material.name, ...material.aliases].map(normalize);
        const exact = values.some((value) => value === normalizedQuery);
        const starts = values.some(
          (value) => value.startsWith(normalizedQuery) || normalizedQuery.startsWith(value)
        );
        const contains = values.some(
          (value) => value.includes(normalizedQuery) || normalizedQuery.includes(value)
        );
        return { material, score: exact ? 3 : starts ? 2 : contains ? 1 : 0 };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.material.name.localeCompare(b.material.name))
      .slice(0, limit)
      .map(({ material }) => material);
  }
}

export interface RuleRepository {
  validate(): string[];
  getJurisdiction(id: string): Jurisdiction | null;
  getServiceProfile(id: string): ServiceProfile | null;
  getSource(id: string): RuleSource | null;
  getRules(jurisdictionId: string, materialId: string): MaterialRule[];
  getBundle(jurisdictionId: string): JurisdictionBundle | null;
  resolvePostalCode(postalCode: string): JurisdictionBundle | null;
}

export class InMemoryRuleRepository implements RuleRepository {
  constructor(
    private readonly bundles: JurisdictionBundle[],
    private readonly materials: MaterialCatalog
  ) {}

  validate() {
    const errors: string[] = [];
    const jurisdictionIds = new Set<string>();
    const ruleIds = new Set<string>();
    for (const bundle of this.bundles) {
      if (jurisdictionIds.has(bundle.jurisdiction.id))
        errors.push(`Duplicate jurisdiction: ${bundle.jurisdiction.id}`);
      jurisdictionIds.add(bundle.jurisdiction.id);
      const profiles = new Set(bundle.serviceProfiles.map((profile) => profile.id));
      const sources = new Set(bundle.sources.map((source) => source.id));
      for (const coverage of bundle.postalCoverage) {
        try {
          new RegExp(coverage.postalCodePattern);
        } catch {
          errors.push(`Invalid postal pattern: ${coverage.postalCodePattern}`);
        }
      }
      for (const rule of bundle.rules) {
        if (ruleIds.has(rule.id)) errors.push(`Duplicate rule: ${rule.id}`);
        ruleIds.add(rule.id);
        const materialId = rule.materialId ?? rule.slug;
        if (!this.materials.get(materialId))
          errors.push(`Unknown material ${materialId} in ${rule.id}`);
        if (!sources.has(rule.sourceId))
          errors.push(`Unknown source ${rule.sourceId} in ${rule.id}`);
        if (rule.jurisdictionId !== bundle.jurisdiction.id)
          errors.push(`Wrong jurisdiction in ${rule.id}`);
        if (rule.effectiveTo && rule.effectiveTo < rule.effectiveFrom)
          errors.push(`Invalid effective interval in ${rule.id}`);
        for (const profile of rule.serviceProfileIds ?? [])
          if (!profiles.has(profile))
            errors.push(`Unknown service profile ${profile} in ${rule.id}`);
      }
      const activeKeys = new Set<string>();
      for (const rule of bundle.rules.filter((entry) => entry.status === "active")) {
        const materialId = rule.materialId ?? rule.slug;
        const key = `${materialId}:${JSON.stringify(rule.scope ?? [...(rule.serviceProfileIds ?? [])].sort())}:${rule.priority}:${rule.effectiveFrom}:${rule.effectiveTo ?? ""}`;
        if (activeKeys.has(key))
          errors.push(`Conflicting active rules for ${materialId} in ${bundle.jurisdiction.id}`);
        activeKeys.add(key);
      }
    }
    return errors;
  }

  getJurisdiction(id: string) {
    return this.getBundle(id)?.jurisdiction ?? null;
  }
  getServiceProfile(id: string) {
    for (const bundle of this.bundles) {
      const profile = bundle.serviceProfiles.find((entry) => entry.id === id);
      if (profile) return profile;
    }
    return null;
  }
  getSource(id: string) {
    for (const bundle of this.bundles) {
      const source = bundle.sources.find((entry) => entry.id === id);
      if (source) return source;
    }
    return null;
  }
  getRules(jurisdictionId: string, materialId: string) {
    return (
      this.getBundle(jurisdictionId)?.rules.filter(
        (rule) => (rule.materialId ?? rule.slug) === materialId
      ) ?? []
    );
  }
  getBundle(jurisdictionId: string) {
    return this.bundles.find((bundle) => bundle.jurisdiction.id === jurisdictionId) ?? null;
  }
  resolvePostalCode(postalCode: string) {
    return (
      this.bundles.find((bundle) =>
        bundle.postalCoverage.some((coverage) =>
          new RegExp(coverage.postalCodePattern).test(postalCode)
        )
      ) ?? null
    );
  }
}
