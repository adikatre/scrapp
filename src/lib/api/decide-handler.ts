import { NextResponse } from "next/server";
import type { DecisionEngine } from "@/lib/rules/decision-engine";
import { apiError, decideRequestSchema } from "./contracts";
import { getRequestId, requestIdHeaders } from "./request";

export function createDecideHandler(engine: DecisionEngine) {
  return async function decide(request: Request) {
    const requestId = getRequestId(request);
    const headers = requestIdHeaders(requestId);
    try {
      const parsed = decideRequestSchema.safeParse(await request.json());
      if (!parsed.success) {
        return NextResponse.json(
          apiError(
            "invalid_decision_request",
            "Choose an item and confirm a jurisdiction and service profile.",
            requestId
          ),
          { status: 400, headers }
        );
      }
      const decision = engine.decide(parsed.data);
      if (!decision) {
        return NextResponse.json(
          {
            decision: null,
            coverage: "unavailable",
            message: "A confirmed local rule is not available for this item and service profile.",
            requestId
          },
          { headers }
        );
      }
      return NextResponse.json({ decision, requestId }, { headers });
    } catch {
      return NextResponse.json(
        apiError("invalid_json", "The decision request is not valid JSON.", requestId),
        { status: 400, headers }
      );
    }
  };
}
