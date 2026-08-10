import { describe, expect, it } from "vitest";
import { SAN_DIEGO_BUNDLE } from "../bundles";
import { DecisionEngine } from "../decision-engine";
import { MATERIALS } from "../materials";
import { InMemoryRuleRepository, MaterialCatalog } from "../repository";
import type { JurisdictionBundle } from "../types";

describe("rule repository extensibility", () => {
  it("registers a second jurisdiction without engine branches", () => {
    const pilot: JurisdictionBundle = {
      jurisdiction: {
        id: "test-pilot",
        country: "US",
        region: "Test",
        municipality: "Pilot City",
        timezone: "UTC",
        supportedLocales: ["en"],
        status: "pilot"
      },
      serviceProfiles: [
        {
          id: "pilot-home",
          jurisdictionId: "test-pilot",
          name: "Pilot home",
          propertyType: "city-serviced-home"
        }
      ],
      sources: [
        {
          id: "pilot-source",
          publisher: "Pilot City",
          title: "Pilot rules",
          url: "https://example.com/rules",
          language: "en",
          lastChecked: "2026-08-10",
          verification: "official"
        }
      ],
      postalCoverage: [{ country: "US", postalCodePattern: "^00001$" }],
      rules: [
        {
          ...SAN_DIEGO_BUNDLE.rules.find((rule) => rule.slug === "plastic-bottle")!,
          id: "pilot-plastic-v1",
          jurisdictionId: "test-pilot",
          serviceProfileIds: ["pilot-home"],
          sourceId: "pilot-source",
          route: "trash",
          bin: "Gray Bin (Trash)"
        }
      ]
    };
    const materials = new MaterialCatalog(MATERIALS);
    const repository = new InMemoryRuleRepository([SAN_DIEGO_BUNDLE, pilot], materials);
    expect(repository.validate()).toEqual([]);
    const decision = new DecisionEngine(repository, materials).decide({
      candidate: { name: "bottle", material: "plastic-bottle", confidence: 1 },
      jurisdictionId: "test-pilot",
      serviceProfileId: "pilot-home"
    });
    expect(decision?.bin).toBe("Gray Bin (Trash)");
    expect(repository.resolvePostalCode("00001")?.jurisdiction.id).toBe("test-pilot");
  });
});
