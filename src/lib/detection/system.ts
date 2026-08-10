import { materialCatalog } from "@/lib/rules/catalog";
import { createDetectionProvider } from "./registry";
import { DetectionService } from "./service";

let service: DetectionService | undefined;

export function getDetectionService() {
  service ??= new DetectionService(createDetectionProvider(), materialCatalog);
  return service;
}

export function resetDetectionServiceForTests() {
  service = undefined;
}
