import type { MaterialCatalog } from "@/lib/rules/repository";
import type { DetectionCandidate, DetectionResult } from "./contracts";
import { DetectionError } from "./errors";
import { normalizeImage } from "./image";
import type { DetectionProvider } from "./provider";

const CHOICE_CONFIDENCE = 0.78;

export class DetectionService {
  constructor(
    private readonly provider: DetectionProvider,
    private readonly materials: MaterialCatalog,
    private readonly timeoutMs = 20_000
  ) {}

  get readiness() {
    return this.provider.readiness();
  }

  get providerMetadata() {
    return { provider: this.provider.id, model: this.provider.model };
  }

  async identifyImage(
    file: File,
    options: { context?: string; requestId: string }
  ): Promise<DetectionResult> {
    const started = Date.now();
    const normalized = await normalizeImage(file);
    const timeout = AbortSignal.timeout(this.timeoutMs);
    const output = await this.provider.detect(
      { kind: "image", ...normalized, context: options.context },
      { requestId: options.requestId, signal: timeout }
    );
    const candidates = [...output.candidates].sort((a, b) => b.confidence - a.confidence);
    if (!candidates.length) {
      throw new DetectionError(
        "unreadable_identification",
        "Scrapp could not identify a clear disposal item in that photo.",
        422
      );
    }
    this.logResult(options.requestId, Date.now() - started, output.usage);
    return this.result(candidates, output.uncertainty, options.requestId, started);
  }

  async identifyText(text: string, requestId: string): Promise<DetectionResult> {
    const started = Date.now();
    const candidates = this.materials.search(text.trim(), 5).map((material, index) => ({
      id: material.id,
      name: material.name,
      material: material.id,
      condition: "unspecified",
      packagingClues: [],
      hazards: material.hazards ?? [],
      confidence: index === 0 ? 0.99 : 0.82
    }));
    return {
      schemaVersion: "2.1",
      candidates,
      uncertainty: candidates.length ? "" : "No verified material matched that description.",
      requiresChoice: candidates.length > 1,
      provider: "material-catalog",
      model: "material-catalog-v1",
      durationMs: Date.now() - started,
      requestId
    };
  }

  private result(
    candidates: DetectionCandidate[],
    uncertainty: string,
    requestId: string,
    started: number
  ): DetectionResult {
    return {
      schemaVersion: "2.1",
      candidates,
      uncertainty,
      requiresChoice: candidates.length > 1 || candidates[0].confidence < CHOICE_CONFIDENCE,
      provider: this.provider.id,
      model: this.provider.model,
      durationMs: Date.now() - started,
      requestId
    };
  }

  private logResult(
    requestId: string,
    durationMs: number,
    usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number }
  ) {
    // biome-ignore lint/suspicious/noConsole: structured server telemetry deliberately excludes user content.
    console.info(
      JSON.stringify({
        event: "detection.completed",
        requestId,
        provider: this.provider.id,
        model: this.provider.model,
        durationMs,
        usage
      })
    );
  }
}
