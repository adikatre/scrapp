import { describe, expect, it } from "vitest";
import { decisionEngine } from "@/lib/rules/system";
import { createDecideHandler } from "../decide-handler";

const handler = createDecideHandler(decisionEngine);
const candidate = {
  id: "cardboard",
  name: "Cardboard",
  material: "cardboard",
  condition: "clean",
  packagingClues: [],
  hazards: [],
  confidence: 0.95
};

describe("decide handler", () => {
  it("requires explicit jurisdiction and service profile", async () => {
    const response = await handler(
      new Request("http://localhost/api/v2/decide", {
        method: "POST",
        body: JSON.stringify({ candidate })
      })
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "invalid_decision_request", retryable: false }
    });
  });

  it("returns a sourced decision for supported context", async () => {
    const response = await handler(
      new Request("http://localhost/api/v2/decide", {
        method: "POST",
        body: JSON.stringify({
          candidate,
          jurisdictionId: "us-ca-san-diego",
          serviceProfileId: "sd-city-serviced-home"
        })
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.decision.bin).toBe("Blue Bin (Recycling)");
    expect(body.decision.source.verification).toBe("official");
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });
});
