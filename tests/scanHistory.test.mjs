// Run with node --test tests/scanHistory.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { require } from "./load-app-typescript.mjs";

const { createScanTicket, saveScan, readScanHandoff, readStoredTickets, buildScanLocationsHref, setScanChoice, buildScanHref } = require("../src/lib/scanHistory.ts");
const storageKey = "scrapp-scan-history";

const stored = new Map();
globalThis.window = Object.assign(new EventTarget(), {
  localStorage: {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value)
  }
});
const prediction = {
  objects: [], detections: [], bin_totals: {},
  text: "Summary for both items.",
  classifier: { source: "adaption", model: "vision", fallback_used: false, basis: "image_and_note" },
  items: [
    { name: "fabric", route: "General Trash", bin: "Gray Bin (Trash)", material: "cotton", caveats: "Check its condition.", confidence: 0.82 },
    { name: "battery", route: "Recycle", bin: "Blue Bin (Recycling)", material: "unknown", caveats: "Check the label.", confidence: 0.67 }
  ]
};

test("selected item and its condition survive navigation, including a second item and a return trip", () => {
  const ticket = createScanTicket(prediction, "A private note about both objects");
  saveScan(ticket);
  setScanChoice(ticket.id, 1, "damaged");
  const selected = readScanHandoff(ticket.id, "1");
  assert.equal(selected.item.name, "battery");
  assert.deepEqual(selected.item.caveats, "Check the label.");
  assert.equal(selected.ticket.items[0].material, "cotton");
  assert.equal(selected.ticket.choices[0], undefined);
  assert.equal(selected.ticket.choices[1], "damaged");
  assert.equal(selected.ticket.classifier.basis, "image_and_note");
  assert.equal(selected.ticket.guidance, prediction.text);
  const href = buildScanLocationsHref(selected.ticket, 1);
  const url = new URL(href, "https://example.test");
  assert.equal(url.searchParams.get("item"), "battery");
  assert.equal(url.searchParams.get("category"), "hazardous");
  assert.equal(url.searchParams.get("bin"), null);
  assert.equal(url.searchParams.get("pick"), "1");
  assert.equal(url.searchParams.get("condition"), "damaged");
  assert.deepEqual(url.searchParams.getAll("q"), []);
  assert.doesNotMatch(href, /private|confidence|caveats|label|Summary/i);
  assert.equal(buildScanHref(ticket.id, 1), `/cam?scan=${ticket.id}&pick=1`);
  for (const bad of ["", "-1", "1.0", "2", "no"]) assert.equal(readScanHandoff(ticket.id, bad), null);
  assert.equal(readScanHandoff("unrelated-id", "0"), null);
});

test("migrates the previous ticket format without retaining the photo, and isolates invalid records", () => {
  stored.set(storageKey, JSON.stringify([null, {
    id: "legacy", timestamp: "2025-01-03T00:00:00Z", image: "data:image/png;base64,secret",
    itemName: "glass jar", disposalRoute: "Recycle", bin: "Blue Bin (Recycling)",
    searchQueries: ["glass recycling"], guidance: "Old summary", note: "Old note"
  }]));
  const ticket = readScanHandoff("legacy", null).ticket;
  assert.equal(ticket.timestamp.getUTCFullYear(), 2025);
  assert.equal(ticket.guidance, "Old summary");
  assert.deepEqual(ticket.items[0].search_queries, ["glass recycling"]);
  assert.doesNotMatch(stored.get(storageKey), /data:image|base64|secret/);
  stored.set(storageKey, "malformed");
  assert.deepEqual(readStoredTickets(), []);
});

test("empty classifications create no location route; old detection-only responses retain detected items", () => {
  assert.equal(createScanTicket({ ...prediction, items: [] }), null);
  const detector = { class_name: "bottle", route: "Recycle", confidence: 0.71, bbox: [0,0,20,20] };
  const legacy = createScanTicket({ objects: ["bottle"], detections: [detector], bin_totals: { Recycle: 1 } });
  assert.equal(legacy.items[0].name, "bottle");
  assert.equal(legacy.classifier.basis, "detections");
});

test("keeps the latest scan readable within the tab when storage writes are denied", () => {
  const ticket = createScanTicket(prediction);
  const originalSet = window.localStorage.setItem;
  window.localStorage.setItem = () => { throw new Error("Quota exceeded"); };
  try {
    saveScan(ticket);
    assert.equal(readScanHandoff(ticket.id, "1").item.name, "battery");
  } finally {
    window.localStorage.setItem = originalSet;
  }
});
