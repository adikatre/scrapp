import { describe, expect, it } from "vitest";
import {
  buildLocationSearchHref,
  decodeLocationSearchParams,
  mergeLocationSearchParams
} from "../locationSearchParams";

describe("location search parameters", () => {
  it("preserves repeatable item queries when decoding and encoding", () => {
    const decoded = decodeLocationSearchParams(
      new URLSearchParams("category=hazardous&item=battery&q=battery+drop-off&q=hazardous+waste")
    );

    expect(decoded).toEqual({
      category: "hazardous",
      item: "battery",
      queries: ["battery drop-off", "hazardous waste"],
      bin: null
    });
    expect(buildLocationSearchHref(decoded)).toBe(
      "/locations?category=hazardous&item=battery&q=battery+drop-off&q=hazardous+waste"
    );
  });

  it("can clear stale scan context when the user chooses a new category", () => {
    const current = decodeLocationSearchParams(
      new URLSearchParams(
        "category=hazardous&item=battery&q=battery+drop-off&bin=Blue+Bin+%28Recycling%29"
      )
    );
    const next = mergeLocationSearchParams(current, {
      category: "general_trash",
      item: null,
      queries: [],
      bin: null
    });

    expect(buildLocationSearchHref(next)).toBe("/locations?category=general_trash");
  });
});
