import type { LocationCategoryKey } from "../locationCategories";
import type { Place } from "../types";

/** The search context a curated program is matched against. */
export type CuratedMatchInput = {
  categoryKey: LocationCategoryKey;
  item?: string | null;
  /**
   * The classifier's own drop-off queries for this item. A fallback signal for
   * what the item is: the item name is free text, so it can arrive as wording no
   * rule anticipates ("Samsung Galaxy S21") while these still name the facility
   * it needs. See `resolveDropoffKind` in ./items.
   */
  queries?: string[] | null;
  lat?: number | null;
  lng?: number | null;
  locationLabel?: string | null;
};

/**
 * A hand-maintained drop-off program (e.g. a county collection event) surfaced
 * alongside live Google Places results. Each provider owns both its data and the
 * rule for when that data is relevant, so adding one touches a single new file
 * plus one line in the registry (see ./index) — nothing in the search pipeline.
 *
 * Use ./sanDiegoBatteries as the template for a new program.
 */
export type CuratedProvider = {
  /** Stable identifier (kebab-case); used for debugging/logging. */
  id: string;
  /** Human-readable program name. */
  name: string;
  /** Whether this program's places belong in the results for this search. */
  matches(input: CuratedMatchInput): boolean;
  /** The curated drop-off sites, already shaped as `Place` cards/markers. */
  places: Place[];
  /** When set and the search has coordinates, only this many nearest places are returned. */
  nearestLimit?: number;
};
