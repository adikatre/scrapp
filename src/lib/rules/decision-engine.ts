import type { MaterialCatalog, RuleRepository } from "./repository";
import type {
  DisposalDecision,
  IdentificationCandidate,
  Jurisdiction,
  MaterialRule,
  ServiceProfile
} from "./types";

function isActive(rule: MaterialRule, date: string) {
  return (
    rule.status === "active" &&
    rule.effectiveFrom <= date &&
    (!rule.effectiveTo || rule.effectiveTo >= date)
  );
}

function scopeRank(rule: MaterialRule, jurisdiction: Jurisdiction, profile: ServiceProfile) {
  if (rule.scope?.level === "service-profile") return rule.scope.ids.includes(profile.id) ? 4 : 0;
  if (rule.serviceProfileIds) return rule.serviceProfileIds.includes(profile.id) ? 4 : 0;
  if (rule.scope?.level === "municipality") return rule.scope.id === jurisdiction.id ? 3 : 0;
  if (rule.scope?.level === "region") return rule.scope.id === jurisdiction.region ? 2 : 0;
  if (rule.scope?.level === "country") return rule.scope.id === jurisdiction.country ? 1 : 0;
  return rule.jurisdictionId === jurisdiction.id ? 3 : 0;
}

export class DecisionEngine {
  constructor(
    private readonly repository: RuleRepository,
    private readonly materials: MaterialCatalog
  ) {}

  decide({
    candidate,
    jurisdictionId,
    serviceProfileId,
    now = new Date()
  }: {
    candidate: Pick<IdentificationCandidate, "name" | "material" | "confidence">;
    jurisdictionId: string;
    serviceProfileId: string;
    now?: Date;
  }): DisposalDecision | null {
    const jurisdiction = this.repository.getJurisdiction(jurisdictionId);
    const profile = this.repository.getServiceProfile(serviceProfileId);
    if (!jurisdiction || !profile || profile.jurisdictionId !== jurisdiction.id) return null;

    const material =
      this.materials.get(candidate.material) ??
      this.materials.search(candidate.material, 1)[0] ??
      this.materials.search(candidate.name, 1)[0];
    if (!material) return null;
    const date = now.toISOString().slice(0, 10);
    const matches = this.repository
      .getRules(jurisdictionId, material.id)
      .filter((rule) => isActive(rule, date))
      .map((rule) => ({ rule, rank: scopeRank(rule, jurisdiction, profile) }))
      .filter(({ rank }) => rank > 0)
      .sort((a, b) => b.rank - a.rank || b.rule.priority - a.rule.priority);
    const rule = matches[0]?.rule;
    if (!rule) return null;
    const source = this.repository.getSource(rule.sourceId);
    if (!source) return null;

    return {
      id: `${rule.id}:${profile.id}`,
      materialId: material.id,
      materialName: material.name,
      itemName: candidate.name,
      route: rule.route,
      bin: rule.bin,
      instruction: rule.instruction,
      preparation: rule.preparation,
      safety: rule.safety ?? [],
      exceptions: rule.exceptions ?? [],
      locationEligible: rule.locationEligible,
      searchQueries: rule.searchQueries ?? [],
      jurisdiction,
      serviceProfile: profile,
      ruleVersion: rule.id,
      source,
      effectiveDate: rule.effectiveFrom,
      lastChecked: source.lastChecked,
      confidence: candidate.confidence,
      coverage: "confirmed"
    };
  }
}
