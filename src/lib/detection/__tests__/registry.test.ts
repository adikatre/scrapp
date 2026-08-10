import { describe, expect, it } from "vitest";
import { createDetectionProvider, registeredDetectionProviders } from "../registry";

describe("detection provider registry", () => {
  it("registers OpenAI as the only production provider", () => {
    expect(registeredDetectionProviders()).toEqual(["openai"]);
  });

  it("fails readiness without silently falling back for unknown providers", () => {
    const provider = createDetectionProvider("local-model");
    expect(provider.id).toBe("local-model");
    expect(provider.readiness()).toEqual({
      ready: false,
      reason: "Unsupported detection provider: local-model"
    });
  });
});
