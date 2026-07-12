import type { LocationCategoryKey } from "../locationCategories";
import type { Place } from "../types";
import { isWithinBounds, type GeoBounds } from "./geo";
import type { CuratedMatchInput, CuratedProvider } from "./types";

/**
 * County of San Diego "Free Battery Collection" program: County Library branches
 * that accept household batteries. Modeled as a curated {@link CuratedProvider}
 * so the branches flow through the same Locations pipeline as live Google Places
 * results (same cards, same map markers).
 */

type BranchSeed = {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
};

/**
 * The County Library branches currently accepting household batteries.
 * Coordinates were geocoded once from the addresses and hardcoded so markers and
 * distance sorting work without a live geocoding call.
 */
const BRANCH_SEEDS: BranchSeed[] = [
  {
    id: "sd-lib-alpine",
    name: "Alpine Library Branch",
    address: "1752 Alpine Blvd., Alpine, CA",
    phone: "(619) 445-4221",
    lat: 32.83804,
    lng: -116.77616
  },
  {
    id: "sd-lib-bonita-sunnyside",
    name: "Bonita-Sunnyside Branch",
    address: "4375 Bonita Rd., Bonita, CA",
    phone: "(619) 475-4642",
    lat: 32.66143,
    lng: -117.03427
  },
  {
    id: "sd-lib-borrego-springs",
    name: "Borrego Springs Branch",
    address: "587 Palm Canyon Dr., Suite 125, Borrego Springs, CA",
    phone: "(760) 767-5761",
    lat: 33.25406,
    lng: -116.37936
  },
  {
    id: "sd-lib-campo-morena-village",
    name: "Campo-Morena Village Branch",
    address: "31356 Highway 94, Campo, CA",
    phone: "(619) 478-5945",
    lat: 32.62451,
    lng: -116.47533
  },
  {
    id: "sd-lib-casa-de-oro",
    name: "Casa de Oro Branch",
    address: "9805 Campo Rd., #180, Spring Valley, CA",
    phone: "(619) 463-3236",
    lat: 32.74707,
    lng: -116.98513
  },
  {
    id: "sd-lib-descanso",
    name: "Descanso Branch",
    address: "9545 River Dr., Descanso, CA",
    phone: "(619) 445-5279",
    lat: 32.86005,
    lng: -116.61491
  },
  {
    id: "sd-lib-fallbrook",
    name: "Fallbrook Branch",
    address: "124 S. Mission Rd., Fallbrook, CA",
    phone: "(760) 731-4650",
    lat: 33.3817,
    lng: -117.25324
  },
  {
    id: "sd-lib-jacumba",
    name: "Jacumba Branch",
    address: "44605 Old Hwy 80, Jacumba, CA",
    phone: "(619) 766-4608",
    lat: 32.61731,
    lng: -116.18711
  },
  {
    id: "sd-lib-julian",
    name: "Julian Branch",
    address: "1850 Highway 78, Julian, CA",
    phone: "(760) 765-0370",
    lat: 33.07697,
    lng: -116.59658
  },
  {
    id: "sd-lib-pine-valley",
    name: "Pine Valley Branch",
    address: "28804 Old Hwy 80, Pine Valley, CA",
    phone: "(619) 473-8022",
    lat: 32.82409,
    lng: -116.53068
  },
  {
    id: "sd-lib-potrero",
    name: "Potrero Branch",
    address: "24883 Potrero Valley Rd., Potrero, CA",
    phone: "(619) 478-5978",
    lat: 32.61079,
    lng: -116.61249
  },
  {
    id: "sd-lib-ramona",
    name: "Ramona Branch",
    address: "1275 Main St., Ramona, CA",
    phone: "(760) 788-5270",
    lat: 33.03992,
    lng: -116.87321
  },
  {
    id: "sd-lib-rancho-san-diego",
    name: "Rancho San Diego Branch",
    address: "11555 Via Rancho San Diego, El Cajon, CA",
    phone: "(619) 660-5370",
    lat: 32.7494,
    lng: -116.92908
  },
  {
    id: "sd-lib-rancho-santa-fe",
    name: "Rancho Santa Fe Branch",
    address: "17040 Avenida de Acacias, Rancho Santa Fe, CA",
    phone: "(858) 756-2512",
    lat: 33.02102,
    lng: -117.20554
  },
  {
    id: "sd-lib-valley-center",
    name: "Valley Center Branch",
    address: "29200 Cole Grade Rd., Valley Center, CA",
    phone: "(760) 749-1305",
    lat: 33.2426,
    lng: -117.02488
  },
  {
    id: "sd-lib-4s-ranch",
    name: "4S Ranch San Diego County Branch",
    address: "10433 Reserve Dr., San Diego, CA",
    phone: "(858) 673-4697",
    lat: 33.02111,
    lng: -117.11434
  }
];

/** Prep requirement carried on each branch card (from the County flyer). */
const BATTERY_PREP_NOTE = "Tape the terminal ends before drop-off.";

/** San Diego County Library site, shown in each branch's expanded details. */
const COUNTY_LIBRARY_WEBSITE = "https://www.sdcl.org";

const PLACES: Place[] = BRANCH_SEEDS.map((b) => ({
  ...b,
  curated: true,
  note: BATTERY_PREP_NOTE,
  website: COUNTY_LIBRARY_WEBSITE
}));

/** Rough bounding box covering San Diego County. */
const SAN_DIEGO_COUNTY_BOUNDS: GeoBounds = {
  minLat: 32.5,
  maxLat: 33.5,
  minLng: -117.6,
  maxLng: -116.1
};

/** Battery disposal is routed to these categories by the classifier/frontend. */
const CATEGORY_KEYS: LocationCategoryKey[] = ["hazardous", "e_waste"];

function isBatteryItem(item?: string | null): boolean {
  return item ? /batter(y|ies)/i.test(item) : false;
}

/**
 * Show these branches only when disposing of batteries (hazardous or e-waste)
 * within San Diego County — detected from real coordinates when available, else
 * from a location label mentioning San Diego (covers the page's default label).
 */
function matches(input: CuratedMatchInput): boolean {
  if (!CATEGORY_KEYS.includes(input.categoryKey)) return false;
  if (!isBatteryItem(input.item)) return false;

  if (input.lat != null && input.lng != null) {
    return isWithinBounds(input.lat, input.lng, SAN_DIEGO_COUNTY_BOUNDS);
  }

  return /san diego/i.test(input.locationLabel ?? "");
}

export const sanDiegoBatteryProgram: CuratedProvider = {
  id: "sd-county-battery-collection",
  name: "County of San Diego: Free Battery Collection",
  matches,
  places: PLACES
};
