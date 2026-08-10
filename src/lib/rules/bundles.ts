import {
  SAN_DIEGO,
  SAN_DIEGO_CITY_HOME,
  SAN_DIEGO_RULES,
  SAN_DIEGO_SOURCES,
  SAN_DIEGO_UNKNOWN_SERVICE
} from "./san-diego";
import type { JurisdictionBundle, MaterialRule } from "./types";

const sanDiegoRules: MaterialRule[] = SAN_DIEGO_RULES.map((rule) => ({
  ...rule,
  materialId: rule.slug
}));

export const SAN_DIEGO_BUNDLE: JurisdictionBundle = {
  jurisdiction: SAN_DIEGO,
  serviceProfiles: [SAN_DIEGO_CITY_HOME, SAN_DIEGO_UNKNOWN_SERVICE],
  sources: SAN_DIEGO_SOURCES,
  rules: sanDiegoRules,
  postalCoverage: [{ country: "US", postalCodePattern: "^921\\d{2}$" }]
};
