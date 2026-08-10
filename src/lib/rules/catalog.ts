import { SAN_DIEGO_BUNDLE } from "./bundles";
import { MATERIALS } from "./materials";
import { InMemoryRuleRepository, MaterialCatalog } from "./repository";

export const materialCatalog = new MaterialCatalog(MATERIALS);
export const ruleRepository = new InMemoryRuleRepository([SAN_DIEGO_BUNDLE], materialCatalog);

export function validateRuleCatalog() {
  return ruleRepository.validate();
}
