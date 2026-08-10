import { NextResponse } from "next/server";
import { ruleRepository } from "@/lib/rules/catalog";

export async function GET(request: Request) {
  const postalCode = new URL(request.url).searchParams.get("postalCode")?.trim() || "";
  const bundle = postalCode ? ruleRepository.resolvePostalCode(postalCode) : null;
  if (bundle) {
    return NextResponse.json({
      jurisdiction: bundle.jurisdiction,
      serviceProfiles: bundle.serviceProfiles,
      requiresServiceConfirmation: true
    });
  }
  return NextResponse.json({
    jurisdiction: null,
    serviceProfiles: [],
    coverage: "unavailable",
    message: postalCode
      ? "Scrapp does not have verified rules for that postal code yet."
      : "Enter a postal code to confirm local coverage."
  });
}
