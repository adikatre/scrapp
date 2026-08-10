"use client";

import posthog from "posthog-js";

type EventName =
  | "input_opened"
  | "camera_permission_outcome"
  | "review_reached"
  | "analysis_started"
  | "analysis_succeeded"
  | "analysis_failed"
  | "decision_viewed"
  | "location_opened"
  | "directions_clicked"
  | "feedback_submitted";

export function trackProductEvent(
  name: EventName,
  properties: Record<string, string | number | boolean | null> = {}
) {
  if (navigator.doNotTrack === "1") return;
  posthog.capture(name, properties);
}
