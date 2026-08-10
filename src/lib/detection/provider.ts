import type {
  DetectionExecutionContext,
  DetectionMode,
  ProviderDetectionInput,
  ProviderDetectionOutput
} from "./contracts";

export type ProviderReadiness = { ready: true } | { ready: false; reason: string };

/**
 * Provider-neutral boundary for photo-based waste identification.
 *
 * Implementations identify foreground waste items and return the shared
 * provider output contract. They must not choose bins, disposal routes,
 * facilities, local rules, or legal outcomes; those decisions happen later
 * in the decision engine.
 *
 * Providers are selected by the detection registry and consumed by
 * `DetectionService`. Readiness checks should be fast and side-effect free.
 * Detection receives an abort signal and request ID for timeout enforcement
 * and request correlation.
 */
export abstract class DetectionProvider {
  /** Stable registry and telemetry identifier for this provider. */
  abstract readonly id: string;
  /** Model or implementation label exposed in detection metadata and logs. */
  abstract readonly model: string;
  /** Detection input modes supported by this provider. */
  abstract readonly capabilities: ReadonlySet<DetectionMode>;

  /** Reports whether the provider is configured and able to serve requests. */
  abstract readiness(): ProviderReadiness;
  /** Identifies plausible foreground items using the shared provider contract. */
  abstract detect(
    input: ProviderDetectionInput,
    context: DetectionExecutionContext
  ): Promise<ProviderDetectionOutput>;
}
