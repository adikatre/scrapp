import { NextResponse } from "next/server";
import { resolveDisposalDecision } from "@/lib/rules/engine";
import type { IdentificationCandidate } from "@/lib/rules/types";

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id")?.slice(0, 128) || crypto.randomUUID();
  try {
    const body = (await request.json()) as {
      candidate?: IdentificationCandidate;
      jurisdictionId?: string;
      serviceProfileId?: string;
    };
    if (!body.candidate?.name || !body.candidate.material) {
      return NextResponse.json(
        {
          error: { code: "invalid_candidate", message: "Choose a valid item candidate.", requestId }
        },
        { status: 400 }
      );
    }
    const decision = resolveDisposalDecision({
      candidate: body.candidate,
      jurisdictionId: body.jurisdictionId,
      serviceProfileId: body.serviceProfileId
    });
    if (!decision) {
      return NextResponse.json({
        decision: null,
        coverage: "unavailable",
        message: "A confirmed local rule is not available for this item and service profile.",
        requestId
      });
    }
    return NextResponse.json({ decision, requestId });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "invalid_json",
          message: "The decision request is not valid JSON.",
          requestId
        }
      },
      { status: 400 }
    );
  }
}
