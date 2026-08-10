import { NextResponse } from "next/server";
import { SAN_DIEGO, SAN_DIEGO_CITY_HOME, SAN_DIEGO_UNKNOWN_SERVICE } from "@/lib/rules/san-diego";

export async function GET(request: Request) {
  const postalCode = new URL(request.url).searchParams.get("postalCode")?.trim() || "";
  if (/^921\d{2}$/.test(postalCode)) {
    return NextResponse.json({
      jurisdiction: SAN_DIEGO,
      serviceProfiles: [SAN_DIEGO_CITY_HOME, SAN_DIEGO_UNKNOWN_SERVICE],
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
