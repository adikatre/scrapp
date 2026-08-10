import {
  SAN_DIEGO,
  SAN_DIEGO_CITY_HOME,
  SAN_DIEGO_RULES,
  SAN_DIEGO_SOURCES,
  SAN_DIEGO_UNKNOWN_SERVICE
} from "./san-diego";
import type {
  DisposalDecision,
  IdentificationCandidate,
  MaterialRule,
  ServiceProfile
} from "./types";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function isActive(rule: MaterialRule, date: string) {
  return (
    rule.status === "active" &&
    rule.effectiveFrom <= date &&
    (!rule.effectiveTo || rule.effectiveTo >= date)
  );
}

export function searchMaterials(query: string, limit = 8) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  return SAN_DIEGO_RULES.map((rule) => {
    const values = [rule.materialName, rule.slug, ...rule.aliases].map(normalize);
    const exact = values.some((value) => value === normalizedQuery);
    const starts = values.some(
      (value) => value.startsWith(normalizedQuery) || normalizedQuery.startsWith(value)
    );
    const contains = values.some(
      (value) => value.includes(normalizedQuery) || normalizedQuery.includes(value)
    );
    return { rule, score: exact ? 3 : starts ? 2 : contains ? 1 : 0 };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.rule.priority - a.rule.priority)
    .slice(0, limit)
    .map(({ rule }) => rule);
}

export function candidateFromRule(rule: MaterialRule, confidence = 1): IdentificationCandidate {
  return {
    id: rule.slug,
    name: rule.materialName,
    material: rule.slug,
    condition: "unspecified",
    packagingClues: [],
    hazards: rule.safety ?? [],
    confidence
  };
}

export function resolveDisposalDecision({
  candidate,
  jurisdictionId = SAN_DIEGO.id,
  serviceProfileId = SAN_DIEGO_CITY_HOME.id,
  now = new Date()
}: {
  candidate: Pick<IdentificationCandidate, "name" | "material" | "confidence">;
  jurisdictionId?: string;
  serviceProfileId?: string;
  now?: Date;
}): DisposalDecision | null {
  if (jurisdictionId !== SAN_DIEGO.id) return null;

  const date = now.toISOString().slice(0, 10);
  const matches = [
    ...searchMaterials(candidate.material, 5),
    ...searchMaterials(candidate.name, 5)
  ].filter((rule, index, all) => all.findIndex((entry) => entry.id === rule.id) === index);
  const rule =
    matches.find((entry) => normalize(entry.slug) === normalize(candidate.material)) ??
    matches.find((entry) =>
      entry.aliases.some((alias) => normalize(alias) === normalize(candidate.name))
    ) ??
    matches[0];

  if (!rule || !isActive(rule, date)) return null;

  const requestedProfile: ServiceProfile =
    serviceProfileId === SAN_DIEGO_CITY_HOME.id ? SAN_DIEGO_CITY_HOME : SAN_DIEGO_UNKNOWN_SERVICE;
  const profileApplies =
    !rule.serviceProfileIds || rule.serviceProfileIds.includes(requestedProfile.id);
  if (!profileApplies) return null;

  const source = SAN_DIEGO_SOURCES.find((entry) => entry.id === rule.sourceId);
  if (!source) return null;

  return {
    id: `${rule.id}:${requestedProfile.id}`,
    materialId: rule.slug,
    materialName: rule.materialName,
    itemName: candidate.name,
    route: rule.route,
    bin: rule.bin,
    instruction: rule.instruction,
    preparation: rule.preparation,
    safety: rule.safety ?? [],
    exceptions: rule.exceptions ?? [],
    locationEligible: rule.locationEligible,
    searchQueries: rule.searchQueries ?? [],
    jurisdiction: SAN_DIEGO,
    serviceProfile: requestedProfile,
    ruleVersion: rule.id,
    source,
    effectiveDate: rule.effectiveFrom,
    lastChecked: source.lastChecked,
    confidence: candidate.confidence,
    coverage: "confirmed"
  };
}

export function getMaterialRule(slug: string) {
  return SAN_DIEGO_RULES.find((rule) => rule.slug === slug) ?? null;
}

export function listMaterialRules() {
  return [...SAN_DIEGO_RULES].sort((a, b) => a.materialName.localeCompare(b.materialName));
}
