import { describe, expect, it } from "vitest";
import { DecisionEngine } from "../decision-engine";
import { MATERIALS } from "../materials";
import { InMemoryRuleRepository, MaterialCatalog } from "../repository";
import type { BinName, JurisdictionBundle, MaterialRule, RuleScope } from "../types";

describe("rule scope precedence", () => {
  it("prefers service, municipality, region, then country before numeric priority", () => {
    const base: MaterialRule = {
      id: "base",
      materialId: "plastic-bottle",
      slug: "plastic-bottle",
      materialName: "Plastic bottle or jug",
      aliases: [],
      route: "trash",
      bin: "Gray Bin (Trash)",
      instruction: "Test rule",
      preparation: [],
      locationEligible: false,
      sourceId: "source",
      jurisdictionId: "pilot",
      effectiveFrom: "2026-01-01",
      priority: 1,
      status: "active"
    };
    const scoped = (
      id: string,
      scope: RuleScope,
      bin: BinName,
      priority: number
    ): MaterialRule => ({ ...base, id, scope, bin, priority });
    const bundle: JurisdictionBundle = {
      jurisdiction: {
        id: "pilot",
        country: "US",
        region: "California",
        municipality: "Pilot",
        timezone: "UTC",
        supportedLocales: ["en"],
        status: "pilot"
      },
      serviceProfiles: [
        {
          id: "pilot-home",
          jurisdictionId: "pilot",
          name: "Pilot home",
          propertyType: "city-serviced-home"
        }
      ],
      sources: [
        {
          id: "source",
          publisher: "Pilot",
          title: "Rules",
          url: "https://example.com",
          language: "en",
          lastChecked: "2026-08-10",
          verification: "official"
        }
      ],
      postalCoverage: [],
      rules: [
        scoped("country", { level: "country", id: "US" }, "Special Drop-off", 1000),
        scoped("region", { level: "region", id: "California" }, "Green Bin (Organics)", 100),
        scoped("municipality", { level: "municipality", id: "pilot" }, "Gray Bin (Trash)", 10),
        scoped(
          "service",
          { level: "service-profile", ids: ["pilot-home"] },
          "Blue Bin (Recycling)",
          1
        )
      ]
    };
    const materials = new MaterialCatalog(MATERIALS);
    const repository = new InMemoryRuleRepository([bundle], materials);
    expect(repository.validate()).toEqual([]);
    const decision = new DecisionEngine(repository, materials).decide({
      candidate: { name: "Bottle", material: "plastic-bottle", confidence: 1 },
      jurisdictionId: "pilot",
      serviceProfileId: "pilot-home"
    });
    expect(decision?.ruleVersion).toBe("service");
    expect(decision?.bin).toBe("Blue Bin (Recycling)");
  });
});
