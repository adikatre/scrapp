import test from "node:test";
import assert from "node:assert/strict";
import { require } from "./load-app-typescript.mjs";

test("an item-specific search does not backfill with generic collection sites", async t => {
  const oldKey = process.env.GOOGLE_PLACES_API_KEY;
  process.env.GOOGLE_PLACES_API_KEY = "offline-test";
  try {
    const { searchPlaces } = require("../src/lib/googlePlaces.ts");
    const requested = [];
    t.mock.method(globalThis, "fetch", async (_url, init) => {
      requested.push(JSON.parse(init.body).textQuery);
      return Response.json({ places: [] });
    });
    const input = { categoryKey: "hazardous", locationLabel: "San Diego", item: "propane grill tank", queries: ["propane tank exchange"] };
    const result = await searchPlaces(input);
    assert.deepEqual(requested, ["propane tank exchange near San Diego"]);
    assert.deepEqual(result.places, []);
    await searchPlaces({ categoryKey: "recycle", locationLabel: "San Diego" });
    assert.equal(requested.length, 2);
    assert.match(requested[1], /recycling center/i);
  } finally {
    if (oldKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY;
    else process.env.GOOGLE_PLACES_API_KEY = oldKey;
  }
});
