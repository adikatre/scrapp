import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PredictionResult } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a data URL to a File object.
 * @param dataUrl The data URL to convert.
 * @param filename The name of the file.
 * @returns A File object or null if the conversion fails.
 *
 * ex. dataURLtoFile("data:image/png;base64,<base64string>", "test.png");
 */
export function dataURLtoFile(dataUrl: string, filename: string) {
  try {
    const [meta, content] = dataUrl.split(",");
    const mime = /data:(.*?);/.exec(meta)?.[1] ?? "image/png";
    const binary = atob(content);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
  } catch {
    return null;
  }
}

export function summarizePrediction(p: PredictionResult) {
  if (p.text) {
    let msg = p.text;

    if (p.items && p.items.length > 0) {
      msg += "\n\n";
      p.items.forEach((item) => {
        msg += `${item.name} (${item.material}): ${item.route}\n`;
      });
    } else if (p.detections.length > 0) {
      msg += "\n\n";
      p.detections.forEach((detection) => {
        msg += `${detection.class_name}: ${detection.route}\n`;
      });
    }

    return msg;
  }

  let msg = "Found: ";

  msg += p.objects.join(", ");
  msg += "\n\n";

  const detections = p.detections;
  detections.forEach((detection) => {
    msg += `${detection.class_name}: ${detection.route}\n`;
  });

  return msg;
}
