// Run from the frontend checkout with: node --test tests/sanDiegoDisposal.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { require } from "./load-app-typescript.mjs";
const { getSanDiegoGuidance } = require("../src/lib/sanDiegoDisposal.ts");
const { resolveDropoffKind } = require("../src/lib/curated/items.ts");
const { getCuratedPlaces } = require("../src/lib/curated/index.ts");
const guide = (name, choice) => getSanDiegoGuidance({ name }, choice);
const places = (item) => getCuratedPlaces({ item, categoryKey: "hazardous", locationLabel: "San Diego" });

test("fabric condition changes the action and remains editable", () => {
  const pending = guide("fabric");
  assert.equal(pending.question.options.length, 4);
  assert.deepEqual(pending.searchQueries, []);
  assert.match(guide("cotton T-shirt", "wearable").title, /Donate/);
  assert.match(guide("torn shirt").title, /recycler/);
  assert.deepEqual(guide("torn shirt", "worn").question, pending.question);
  assert.equal(guide("fabric", "worn").route, "Recycle");
  assert.deepEqual(guide("moldy towel", "wet").searchQueries, []);
  assert.equal(guide("oil-soaked rag", "wearable").route, "Hazardous Waste");
});

test("gas label distinguishes propane appointments, grill exchange and calling first", () => {
  assert.deepEqual(guide("camping gas canister").searchQueries, []);
  assert.match(guide("empty 1-lb propane cylinder").steps.join(" "), /Miramar.*appointment/i);
  assert.match(guide("propane bottle", "camp").steps.join(" "), /City address/);
  assert.match(guide("propane cylinder", "grill").searchQueries.join(" "), /grill tank exchange/);
  assert.deepEqual(guide("oxygen tank", "grill").searchQueries, []);
  assert.match(guide("butane canister").title, /Confirm/);
  assert.deepEqual(guide("30 lb propane grill tank", "camp").searchQueries, []);
  assert.equal(guide("30 lb propane grill tank", "camp").question, undefined);
  assert.match(guide("leaking propane cylinder", "camp").steps.join(" "), /911/);
});

test("battery answers constrain the facilities and details available", () => {
  assert.deepEqual(guide("battery").searchQueries, []);
  assert.deepEqual(guide("EV traction battery").searchQueries, []);
  assert.deepEqual(guide("EV traction battery", "household").searchQueries, []);
  assert.equal(guide("9V battery").lookupItem, "intact household battery");
  assert.equal(guide("lead-acid battery").lookupItem, "lead-acid starter battery");
  assert.equal(guide("e-bike battery").lookupItem, "e-bike battery");
  for (const [choice, kind] of [["household", "household"], ["vehicle", "vehicle"], ["ebike", "ebike"]]) {
    const resolved = guide("battery", choice);
    assert.equal(resolveDropoffKind({ item: resolved.lookupItem }), kind);
  }
  for (const name of ["swollen battery", "leaking AA batteries", "damaged e-bike battery"]) {
    const result = guide(name, "household");
    assert.deepEqual(result.searchQueries, []);
    assert.match(result.steps.join(" "), /Miramar excludes swollen/);
    assert.equal(places(name).length, 0);
  }
});

test("bulb chemistry distinguishes hazardous collection from ordinary trash", () => {
  assert.match(guide("light bulb").question.label, /type of bulb/);
  assert.equal(guide("light bulb", "incandescent").bin, "Gray Bin (Trash)");
  assert.equal(guide("LED bulb", "incandescent").bin, "Special Drop-off");
  assert.deepEqual(guide("broken fluorescent tube").searchQueries, []);
  assert.match(guide("CFL bulb").steps.join(" "), /appointment/);
});

test("curated sites explicitly accept the program being requested", () => {
  const household = places("intact household battery");
  assert.ok(household.some(site => site.id.startsWith("sd-lib")));
  assert.ok(household.filter(site => !site.id.startsWith("sd-lib")).every(site =>
    site.note.includes("single-use batteries") && site.note.includes("rechargeable batteries")));
  const packs = places("e-bike battery");
  assert.ok(packs.length > 0);
  assert.ok(packs.every(site => site.note.includes("e-bike batteries")));
  assert.equal(places("car battery").length, 0);
  assert.equal(places("e-scooter battery").length, 0);
});

test("city bin rules depend on the item, independently of a suggested model route", () => {
  for (const [name, bin] of [
    ["wine glass", "Gray Bin (Trash)"], ["compostable fork", "Gray Bin (Trash)"],
    ["banana peel", "Green Bin (Organics)"], ["food-soiled paper towel", "Green Bin (Organics)"],
    ["glass bottle", "Blue Bin (Recycling)"], ["shredded paper", "Blue Bin (Recycling)"]
  ]) {
    const result = getSanDiegoGuidance({ name, bin: "Special Drop-off", route: "E-Waste" });
    assert.equal(result.bin, bin, name);
    assert.deepEqual(result.searchQueries, []);
    assert.ok(result.source.url.startsWith("https://www.sandiego.gov/"));
  }
  assert.match(guide("pesticide in plastic bottle").title, /hazardous/i);
});

test("cues from different objects and ambiguous model labels do not produce a local bin claim", () => {
  for (const name of ["unknown", "bottle", "metal", "propane tank regulator", "banana wrapper", "fabric-covered chair", "greasy cardboard box", "battery charger", "battery-powered lamp", "fabric softener", "phone case"]) {
    assert.equal(guide(name), undefined, name);
  }
});

test("a typed city or ZIP without a geocode only returns matching program addresses", () => {
  const byArea = locationLabel => getCuratedPlaces({ item: "AA batteries", categoryKey: "hazardous", locationLabel });
  const citySites = byArea("Ramona, CA");
  assert.ok(citySites.some(p => p.id === "sd-lib-ramona"));
  assert.ok(citySites.every(p => p.address.includes(", Ramona,")));
  const zipSites = byArea("92111");
  assert.ok(zipSites.length > 0);
  assert.ok(zipSites.every(p => p.address.endsWith(" 92111")));
  assert.deepEqual(byArea("San Diego, TX"), []);
});
