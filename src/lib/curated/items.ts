import type { CuratedMatchInput } from "./types";

/**
 * How a scanned item maps to the kind of battery drop-off it needs.
 *
 * Shared by every battery program so they agree on the split: an e-bike pack and
 * a pack of AAs are both "batteries", but they go to different places — a bike
 * shop will not take your AAs, and a library collection box will not take a
 * 500Wh e-bike pack (or a 40lb car battery).
 */

/**
 * The drop-off an item needs. `vehicle` is a real answer, not a failure: no site
 * in any curated program takes lead-acid, so resolving to it deliberately yields
 * no curated places and leaves the search to Google (auto parts stores, which
 * take them back).
 */
export type DropoffKind = "vehicle" | "ebike" | "cellphone" | "household";

const BATTERY = /batter(y|ies)/i;

/**
 * A lead-acid host, matched by co-occurrence with "battery" rather than by
 * adjacency: the classifier does not reliably put the words together, so
 * "battery from my car" and "golf cart battery" both have to land here. A toy
 * car runs on AAs, so it is excluded — that is a household battery, not a 40lb
 * lead-acid one.
 */
const VEHICLE =
  /\b(car|truck|automotive|vehicle|motorcycle|marine|boat|rv|golf cart|atv|tractor|lawn ?mower)\b/i;
const TOY = /\btoy\b|\bremote[\s-]?control(led)?\b|\brc\b/i;

/**
 * Wording that is a device rather than a battery or a handset: a charging cable
 * belongs in neither a Call2Recycle bucket nor a cell phone box. Deliberately
 * does NOT include a bare "case" — that would eat "case of AA batteries" — so
 * the only case that counts is one worn by a gadget.
 */
const ACCESSORY =
  /\b(charger|charging|cable|cord|adapter|dock|headphones?)\b|\b(phone|tablet|laptop)\s+case\b/i;

/** A rechargeable cell in a case. Must beat ACCESSORY, which "charger" hits. */
const POWER_BANK = /\bpower\s?bank\b|\bportable charger\b/i;

/**
 * High-energy e-mobility packs, which need a site rated to accept them.
 *
 * Every alternative is anchored with \b. Without it, "e[\s-]?bike" matches the
 * "e bike" sitting inside "th_e bike_" and "exercis_e bike_", which routed an
 * exercise bike to a hazmat drop-off.
 */
const EBIKE =
  /\be[\s-]?(bike|scooter|mobility)\b|\belectric\s+(bike|bicycle|scooter|skateboard)\b|\bscooter\s+batter|\bhoverboard\b/i;

/**
 * A handset, which the network collects whole rather than as a loose battery —
 * the classifier's usual wording ("smartphone", "iPhone") never mentions a
 * battery, so it has to be recognised on its own.
 *
 * The optional prefix lets "smartphone" match as one word, while the leading \b
 * keeps "microphone" and "telephone pole" out.
 */
const CELLPHONE = /\b(?:smart|cell|mobile|flip)?[\s-]?phones?\b|\biphone\b/i;

/**
 * The kind a single piece of text reads as, or null if it names none.
 *
 * Ordered, because the classifier's wording overlaps and only the first reading
 * routes the item somewhere that will actually accept it: a "hoverboard battery"
 * is both a hoverboard and a battery, and a "cell phone battery" is both a
 * handset and a battery.
 *
 * `strict` drops the bare-battery rule, whose wording is too loose to mean
 * anything outside an item name — see `resolveDropoffKind`.
 */
function classifyText(text: string, strict = false): DropoffKind | null {
  if (/\blead[\s-]?acid\b/i.test(text)) return "vehicle";
  if (VEHICLE.test(text) && BATTERY.test(text) && !TOY.test(text)) {
    return "vehicle";
  }
  if (EBIKE.test(text)) return "ebike";
  if (POWER_BANK.test(text)) return "household";
  if (ACCESSORY.test(text)) return null;
  // A loose battery, phone's included — before the handset rule, so a "cell
  // phone battery" is treated as the battery it is.
  if (!strict && BATTERY.test(text)) return "household";
  if (CELLPHONE.test(text)) return "cellphone";
  return null;
}

/**
 * The one drop-off kind a search is for, or null if it is not a battery search.
 *
 * The item name decides it whenever it can. The classifier's search queries are
 * a secondary signal for when the name is wording we cannot enumerate: it emits
 * free text, so a phone arrives as "Samsung Galaxy S21" or "Xiaomi Redmi Note",
 * which no regex over brand names will ever reliably catch.
 *
 * Queries are read strictly, because measuring the real classifier showed they
 * name the *facility* and only sometimes the item. Across a sample of brand-name
 * phones it never once emitted "cell phone recycling"; it emitted "electronics
 * recycling drop-off", "Samsung device recycling center" — and, for three of
 * them, a generic "battery recycling drop-off". Trusting that last one would
 * read a handset as a household battery and send it to a library collection box
 * that does not take handsets. So a query only settles the kind when it names
 * the item ("iPhone recycling drop-off", "car battery recycling"), never when it
 * merely says "battery".
 *
 * They are also strictly a fallback and never widen a name that already
 * resolved, or an e-bike pack's own generic battery query would put library
 * branches back in front of someone holding 500Wh.
 */
export function resolveDropoffKind(
  input: Pick<CuratedMatchInput, "item" | "queries">
): DropoffKind | null {
  if (input.item) {
    const fromItem = classifyText(input.item);
    if (fromItem) return fromItem;
  }

  for (const query of input.queries ?? []) {
    const fromQuery = classifyText(query, true);
    if (fromQuery) return fromQuery;
  }

  return null;
}
