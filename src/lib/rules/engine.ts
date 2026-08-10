import { SAN_DIEGO_BUNDLE } from "./bundles";
import { materialCatalog } from "./catalog";
import { decisionEngine } from "./system";
import type { IdentificationCandidate, MaterialRule } from "./types";

function guideRule(materialId: string): MaterialRule | null {
  const material = materialCatalog.get(materialId);
  const rule = SAN_DIEGO_BUNDLE.rules.find(
    (entry) => (entry.materialId ?? entry.slug) === materialId
  );
  if (!material || !rule) return null;
  return {
    ...rule,
    materialId,
    slug: material.id,
    materialName: material.name,
    aliases: material.aliases
  };
}

export function searchMaterials(query: string, limit = 8) {
  return materialCatalog
    .search(query, limit)
    .map((material) => guideRule(material.id))
    .filter((rule): rule is MaterialRule => Boolean(rule));
}

export function candidateFromRule(rule: MaterialRule, confidence = 1): IdentificationCandidate {
  return {
    id: rule.materialId ?? rule.slug,
    name: rule.materialName,
    material: rule.materialId ?? rule.slug,
    condition: "unspecified",
    packagingClues: [],
    hazards: rule.safety ?? [],
    confidence
  };
}

export function resolveDisposalDecision({
  candidate,
  jurisdictionId,
  serviceProfileId,
  now
}: {
  candidate: Pick<IdentificationCandidate, "name" | "material" | "confidence">;
  jurisdictionId: string;
  serviceProfileId: string;
  now?: Date;
}) {
  return decisionEngine.decide({ candidate, jurisdictionId, serviceProfileId, now });
}

export function getMaterialRule(slug: string) {
  return guideRule(slug);
}

export function listMaterialRules() {
  return materialCatalog
    .list()
    .map((material) => guideRule(material.id))
    .filter((rule): rule is MaterialRule => Boolean(rule));
}
