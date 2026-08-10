import type { DetectionExecutionContext, ProviderDetectionInput } from "./contracts";
import { DetectionError } from "./errors";
import { DetectionProvider } from "./provider";
import { OpenAIResponsesDetectionProvider } from "./providers/openai";

type ProviderFactory = () => DetectionProvider;

const factories: Record<string, ProviderFactory> = {
  openai: () => new OpenAIResponsesDetectionProvider()
};

class UnsupportedDetectionProvider extends DetectionProvider {
  readonly id: string;
  readonly model = "unavailable";
  readonly capabilities = new Set<never>();

  constructor(name: string) {
    super();
    this.id = name;
  }

  readiness() {
    return { ready: false, reason: `Unsupported detection provider: ${this.id}` } as const;
  }

  async detect(
    _input: ProviderDetectionInput,
    _context: DetectionExecutionContext
  ): Promise<never> {
    throw new DetectionError(
      "classifier_unavailable",
      "Photo identification is not configured on this deployment.",
      503,
      true
    );
  }
}

export function createDetectionProvider(name = process.env.DETECTION_PROVIDER ?? "openai") {
  return factories[name]?.() ?? new UnsupportedDetectionProvider(name);
}

export function registeredDetectionProviders() {
  return Object.keys(factories);
}
