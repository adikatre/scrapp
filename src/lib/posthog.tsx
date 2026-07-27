"use client";

import posthog from "posthog-js";
import {PostHogProvider as PHProvider} from "posthog-js/react";
import {useEffect} from "react";

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({children}: PostHogProviderProps) {
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

    if (!apiKey) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[PostHog] NEXT_PUBLIC_POSTHOG_KEY not set, analytics disabled");
      }
      return;
    }

    posthog.init(apiKey, {
      api_host: host,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      debug: process.env.NODE_ENV === "development",
      opt_out_capturing_by_default: false,
      respect_dnt: true,
      persistence: "localStorage"
    });

    return () => {
      posthog.shutdown();
    };
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

// Event names as constants for consistency
export const POSTHOG_EVENTS = {
  SCAN_STARTED: "scan_started",
  SCAN_COMPLETED: "scan_completed",
  SCAN_FAILED: "scan_failed",
  FEEDBACK_SUBMITTED: "feedback_submitted",
  LOCATIONS_VIEWED: "locations_viewed",
  LOCATION_SELECTED: "location_selected",
  DIRECTIONS_OPENED: "directions_opened",
  CATEGORY_CHANGED: "category_changed",
  LOCATION_SEARCHED: "location_searched",
  CAMERA_PERMISSION_GRANTED: "camera_permission_granted",
  CAMERA_PERMISSION_DENIED: "camera_permission_denied",
  GEOLOCATION_PERMISSION_GRANTED: "geolocation_permission_granted",
  GEOLOCATION_PERMISSION_DENIED: "geolocation_permission_denied",
  PWA_INSTALLED: "pwa_installed",
  SHARE_CLICKED: "share_clicked"
} as const;

// Helper functions for common tracking patterns
export function trackScanStarted(source: "camera" | "upload", deviceType: "mobile" | "desktop") {
  posthog.capture(POSTHOG_EVENTS.SCAN_STARTED, {
    source,
    device_type: deviceType,
    timestamp: new Date().toISOString()
  });
}

export function trackScanCompleted(
  route: string,
  confidence: number,
  itemName: string,
  deviceType: "mobile" | "desktop",
  source: "camera" | "upload"
) {
  posthog.capture(POSTHOG_EVENTS.SCAN_COMPLETED, {
    route,
    confidence,
    item_name: itemName,
    device_type: deviceType,
    source,
    timestamp: new Date().toISOString()
  });
}

export function trackScanFailed(
  error: string,
  deviceType: "mobile" | "desktop",
  source: "camera" | "upload"
) {
  posthog.capture(POSTHOG_EVENTS.SCAN_FAILED, {
    error,
    device_type: deviceType,
    source,
    timestamp: new Date().toISOString()
  });
}

export function trackFeedback(correct: boolean, route: string, itemName: string) {
  posthog.capture(POSTHOG_EVENTS.FEEDBACK_SUBMITTED, {
    correct,
    route,
    item_name: itemName,
    timestamp: new Date().toISOString()
  });
}

export function trackLocationsViewed(
  category: string,
  resultCount: number,
  hasCoords: boolean,
  deviceType: "mobile" | "desktop"
) {
  posthog.capture(POSTHOG_EVENTS.LOCATIONS_VIEWED, {
    category,
    result_count: resultCount,
    has_coords: hasCoords,
    device_type: deviceType,
    timestamp: new Date().toISOString()
  });
}

export function trackLocationSelected(
  placeId: string,
  placeName: string,
  category: string,
  distanceMiles: number | null
) {
  posthog.capture(POSTHOG_EVENTS.LOCATION_SELECTED, {
    place_id: placeId,
    place_name: placeName,
    category,
    distance_miles: distanceMiles,
    timestamp: new Date().toISOString()
  });
}

export function trackDirectionsOpened(
  placeId: string,
  placeName: string,
  method: "google_maps" | "apple_maps" | "waze"
) {
  posthog.capture(POSTHOG_EVENTS.DIRECTIONS_OPENED, {
    place_id: placeId,
    place_name: placeName,
    method,
    timestamp: new Date().toISOString()
  });
}

export function trackCategoryChanged(category: string, deviceType: "mobile" | "desktop") {
  posthog.capture(POSTHOG_EVENTS.CATEGORY_CHANGED, {
    category,
    device_type: deviceType,
    timestamp: new Date().toISOString()
  });
}

export function trackLocationSearched(query: string, resultCount: number, hasCoords: boolean) {
  posthog.capture(POSTHOG_EVENTS.LOCATION_SEARCHED, {
    query,
    result_count: resultCount,
    has_coords: hasCoords,
    timestamp: new Date().toISOString()
  });
}

export function trackCameraPermission(granted: boolean) {
  posthog.capture(
    granted ? POSTHOG_EVENTS.CAMERA_PERMISSION_GRANTED : POSTHOG_EVENTS.CAMERA_PERMISSION_DENIED,
    {
      timestamp: new Date().toISOString()
    }
  );
}

export function trackGeolocationPermission(granted: boolean) {
  posthog.capture(
    granted
      ? POSTHOG_EVENTS.GEOLOCATION_PERMISSION_GRANTED
      : POSTHOG_EVENTS.GEOLOCATION_PERMISSION_DENIED,
    {
      timestamp: new Date().toISOString()
    }
  );
}

export function trackPWAInstalled() {
  posthog.capture(POSTHOG_EVENTS.PWA_INSTALLED, {
    timestamp: new Date().toISOString()
  });
}

export function trackShareClicked(
  platform: string,
  contentType: "scan_result" | "location" | "app"
) {
  posthog.capture(POSTHOG_EVENTS.SHARE_CLICKED, {
    platform,
    content_type: contentType,
    timestamp: new Date().toISOString()
  });
}

// Feature flags
export function getFeatureFlag(flagKey: string): boolean | string | undefined {
  return posthog.getFeatureFlag(flagKey);
}

// User identification
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  posthog.identify(userId, properties);
}

export function resetUser() {
  posthog.reset();
}

export {posthog};
