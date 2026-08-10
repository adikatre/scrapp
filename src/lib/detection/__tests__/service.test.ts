import { describe, expect, it } from "vitest";
import { MATERIALS } from "@/lib/rules/materials";
import { MaterialCatalog } from "@/lib/rules/repository";
import type {
  DetectionExecutionContext,
  ProviderDetectionInput,
  ProviderDetectionOutput
} from "../contracts";
import { DetectionProvider } from "../provider";
import { DetectionService } from "../service";

class FakeProvider extends DetectionProvider {
  readonly id = "fake";
  readonly model = "fake-v1";
  readonly capabilities = new Set(["image"] as const);
  constructor(private readonly output: ProviderDetectionOutput) {
    super();
  }
  readiness() {
    return { ready: true } as const;
  }
  async detect(_input: ProviderDetectionInput, _context: DetectionExecutionContext) {
    return this.output;
  }
}

describe("DetectionService", () => {
  const materials = new MaterialCatalog(MATERIALS);

  it("uses the local material catalog for text", async () => {
    const service = new DetectionService(
      new FakeProvider({ candidates: [], uncertainty: "" }),
      materials
    );
    const result = await service.identifyText("charger", "request-1");
    expect(result.provider).toBe("material-catalog");
    expect(result.candidates[0]?.material).toBe("electronics");
  });

  it("marks multiple candidates as requiring a choice", async () => {
    const service = new DetectionService(
      new FakeProvider({ candidates: [], uncertainty: "" }),
      materials
    );
    const result = await service.identifyText("foam", "request-2");
    expect(result.candidates.length).toBeGreaterThan(1);
    expect(result.requiresChoice).toBe(true);
  });
});
