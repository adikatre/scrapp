import { materialCatalog, ruleRepository } from "./catalog";
import { DecisionEngine } from "./decision-engine";

export const decisionEngine = new DecisionEngine(ruleRepository, materialCatalog);
