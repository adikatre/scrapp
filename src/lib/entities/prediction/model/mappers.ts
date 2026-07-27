import { type LocationCategoryKey, routeToCategoryKey } from "@/lib/locationCategories";
import type { PredictionResult } from "./types";

/**
 * Extract the dominant disposal route from a prediction result.
 * Prefers classified items over raw detections.
 */
export function getDominantRoute(prediction: PredictionResult): string {
  if (prediction.items && prediction.items.length > 0) {
    // Use the first classified item's route as dominant
    return prediction.items[0].route;
  }
  if (prediction.detections && prediction.detections.length > 0) {
    return prediction.detections[0].route;
  }
  return "Unknown";
}

/**
 * Extract the dominant item name from a prediction result.
 */
export function getDominantItemName(prediction: PredictionResult): string {
  if (prediction.items && prediction.items.length > 0) {
    return prediction.items[0].name;
  }
  if (prediction.detections && prediction.detections.length > 0) {
    return prediction.detections[0].class_name;
  }
  if (prediction.objects && prediction.objects.length > 0) {
    return prediction.objects[0];
  }
  return "Unidentified item";
}

/**
 * Extract the dominant bin from a prediction result.
 * Prefers the bin from classified items, falls back to bin_totals.
 */
export function getDominantBin(prediction: PredictionResult): string | undefined {
  if (prediction.items && prediction.items.length > 0) {
    return prediction.items[0].bin;
  }
  if (prediction.bin_totals && Object.keys(prediction.bin_totals).length > 0) {
    const bins = Object.entries(prediction.bin_totals);
    return bins.sort((a, b) => b[1] - a[1])[0][0];
  }
  return undefined;
}

/**
 * Extract search queries from a prediction result.
 */
export function getDominantSearchQueries(prediction: PredictionResult): string[] {
  if (prediction.items && prediction.items.length > 0) {
    return prediction.items[0].search_queries ?? [];
  }
  return [];
}

/**
 * Map a prediction result to a location category key.
 * Uses the bin (curbside destination) as the primary signal,
 * falls back to the disposal route.
 */
export function predictionToCategoryKey(prediction: PredictionResult): LocationCategoryKey {
  const bin = getDominantBin(prediction);
  const route = getDominantRoute(prediction);

  // Import resolveCategoryKey logic here to avoid circular deps
  if (bin) {
    const { resolveCategoryKey } = require("@/lib/locationCategories");
    return resolveCategoryKey(route, bin);
  }
  return routeToCategoryKey(route);
}

/**
 * Create a human-readable summary of the prediction for display.
 */
export function summarizePrediction(prediction: PredictionResult): string {
  if (prediction.text) {
    let msg = prediction.text;
    if (prediction.items && prediction.items.length > 0) {
      msg += "\n\n";
      prediction.items.forEach((item) => {
        msg += `${item.name} (${item.material}): ${item.route}\n`;
      });
    } else if (prediction.detections.length > 0) {
      msg += "\n\n";
      prediction.detections.forEach((detection) => {
        msg += `${detection.class_name}: ${detection.route}\n`;
      });
    }
    return msg;
  }

  let msg = "Found: ";
  for (const object of prediction.objects) {
    msg += `${object}, `;
  }
  msg += "\n\n";
  prediction.detections.forEach((detection) => {
    msg += `${detection.class_name}: ${detection.route}\n`;
  });
  return msg;
}

/**
 * Get the confidence level of the dominant prediction.
 */
export function getDominantConfidence(prediction: PredictionResult): number {
  if (prediction.items && prediction.items.length > 0) {
    return prediction.items[0].confidence;
  }
  if (prediction.detections && prediction.detections.length > 0) {
    return prediction.detections[0].confidence;
  }
  return 0;
}

/**
 * Check if prediction has high confidence (>= 0.8).
 */
export function isHighConfidence(prediction: PredictionResult): boolean {
  return getDominantConfidence(prediction) >= 0.8;
}

/**
 * Get all unique routes from a prediction.
 */
export function getAllRoutes(prediction: PredictionResult): string[] {
  const routes = new Set<string>();
  if (prediction.items) {
    for (const item of prediction.items) {
      routes.add(item.route);
    }
  }
  for (const detection of prediction.detections) {
    routes.add(detection.route);
  }
  return Array.from(routes);
}
