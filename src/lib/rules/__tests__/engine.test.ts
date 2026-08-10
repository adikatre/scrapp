import { describe, expect, it } from "vitest";
import { resolveDisposalDecision, searchMaterials } from "../engine";

const context = { jurisdictionId: "us-ca-san-diego", serviceProfileId: "sd-city-serviced-home" };

describe("rules engine", () => {
  it("resolves exact San Diego material aliases deterministically", () => {
    const decision = resolveDisposalDecision({
      candidate: { name: "water bottle", material: "plastic bottle", confidence: 0.93 },
      ...context
    });
    expect(decision?.bin).toBe("Blue Bin (Recycling)");
    expect(decision?.source.verification).toBe("official");
    expect(decision?.ruleVersion).toBe("sd-plastic-bottle-v1");
  });

  it("keeps plastic film out of recycling", () => {
    const decision = resolveDisposalDecision({
      candidate: { name: "grocery bag", material: "plastic film", confidence: 0.89 },
      ...context
    });
    expect(decision?.bin).toBe("Gray Bin (Trash)");
    expect(decision?.locationEligible).toBe(false);
  });

  it("returns unavailable when the jurisdiction is not supported", () => {
    expect(
      resolveDisposalDecision({
        candidate: { name: "battery", material: "battery", confidence: 0.9 },
        jurisdictionId: "us-ny-new-york",
        serviceProfileId: "unknown"
      })
    ).toBeNull();
  });

  it("does not apply city curbside rules to an unknown provider", () => {
    expect(
      resolveDisposalDecision({
        candidate: { name: "cardboard", material: "cardboard", confidence: 1 },
        jurisdictionId: "us-ca-san-diego",
        serviceProfileId: "sd-service-unknown"
      })
    ).toBeNull();
  });

  it("finds known material aliases without invoking vision", () => {
    expect(searchMaterials("charger")[0]?.slug).toBe("electronics");
  });
});
