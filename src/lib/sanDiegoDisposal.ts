import { resolveDropoffKind, hasBatteryDamage } from "./curated/items";
import {
  BIN_BLUE, BIN_GRAY, BIN_GREEN, BIN_SPECIAL
} from "./locationCategories";

type Choice = { value: string; label: string };
type Question = { label: string; options: Choice[] };
type Source = { label: string; url: string };

export type SanDiegoGuidance = {
  title: string;
  steps: string[];
  source: Source;
  route: string;
  bin: string;
  /** Empty when the next action is at home, a phone call or a specific program. */
  searchQueries: string[];
  /** The resolved material a location provider should match when the original name was ambiguous. */
  lookupItem?: string;
  question?: Question;
};

type GuidanceInput = { name: string; material?: string; route?: string; bin?: string };

const CITY_HHW = {
  label: "City hazardous waste and appointments",
  url: "https://www.sandiego.gov/environmental-services/ep/hazardous"
};
const COUNTY_TEXTILES = {
  label: "County textile reuse and recycling guide",
  url: "https://www.sandiegocounty.gov/content/sdc/dpw/recycling/Textiles.html"
};
const COUNTY_BATTERIES = {
  label: "County battery collection locations",
  url: "https://www.sandiegocounty.gov/content/sdc/dpw/recycling/hhw/uwaste.html"
};
const BIN_GUIDE = {
  label: "City of San Diego bin guide",
  url: "https://www.sandiego.gov/sites/default/files/what_goes_where_guide_english.pdf"
};
const CITY_CURBSIDE = {
  label: "City curbside collection guide",
  url: "https://www.sandiego.gov/environmental-services/recycling/residential/curbside"
};

const HHW = { route: "Hazardous Waste", bin: BIN_SPECIAL, source: CITY_HHW };
const TEXTILE = { route: "Bulky Items (Donate)", bin: BIN_SPECIAL, source: COUNTY_TEXTILES };
const BLUE = { route: "Recycle", bin: BIN_BLUE, source: BIN_GUIDE };
const GREEN = { route: "Compost", bin: BIN_GREEN, source: BIN_GUIDE };
const GRAY = { route: "General Trash", bin: BIN_GRAY, source: BIN_GUIDE };

const CITY_APPOINTMENT =
  "City of San Diego residents can book a free Miramar household hazardous waste appointment. Bring ID or a bill showing your City address.";
const CALL_CITY = "Call San Diego Environmental Services at 858-694-7000 before transporting it.";

const FABRIC_CONDITION: Question = {
  label: "What condition is the fabric in?",
  options: [
    { value: "wearable", label: "Clean and usable" },
    { value: "worn", label: "Dry but torn or worn" },
    { value: "wet", label: "Wet or moldy" },
    { value: "contaminated", label: "Paint, oil or chemicals" }
  ]
};

function textiles(name: string, choice?: string): SanDiegoGuidance {
  const base = { ...TEXTILE, question: FABRIC_CONDITION, searchQueries: [] };
  // A reported hazardous contaminant takes precedence over appearance or wear.
  const chemicalResidue = /\b(?:paint|solvents?|pesticides?|gasoline|motor oil|oily|oil[- ]soaked|chemicals?)\b/.test(name);
  if (choice === "contaminated" || chemicalResidue) {
    return {
      ...base,
      ...HHW,
      question: chemicalResidue ? undefined : FABRIC_CONDITION,
      title: "Check how to handle the contaminated fabric",
      steps: [
        "Keep it out of donation bags and household bins. Tell the City which substance is on it.",
        CALL_CITY
      ]
    };
  }
  if (/\b(?:blood|bloody|bodily fluids?)\b/.test(name)) {
    return {
      ...TEXTILE,
      title: "Keep contaminated fabric out of textile collections",
      searchQueries: [],
      steps: ["Textile collectors exclude fabric contaminated with bodily fluids. Ask your waste hauler how to dispose of it."]
    };
  }
  if (choice === "wet" || (!choice && /\b(?:wet|moldy|mildew(?:ed)?)\b/.test(name))) {
    return {
      ...base,
      title: "Keep wet or moldy fabric out of donations",
      steps: ["If it is only wet and can be washed, dry it fully and check its condition again. Ask your hauler about disposal if it remains moldy."]
    };
  }
  if (choice === "worn" || (!choice && /\b(?:torn|ripped|frayed|worn[- ]out|threadbare)\b/.test(name))) {
    return {
      ...base,
      route: "Recycle",
      title: "Find a recycler for dry, worn textiles",
      steps: ["Repair it or reuse it as a rag. For recycling, confirm the site takes damaged fabric, then mark a clear bag “For Recycling Only.” Keep the fabric out of your blue bin."],
      searchQueries: ["damaged textile recycling drop-off"]
    };
  }
  if (choice === "wearable") {
    return {
      ...base,
      title: "Donate the clean, usable fabric",
      steps: ["Check whether a local thrift store accepts this garment or household linen before dropping it off."],
      searchQueries: ["clothing and household linen donation center"]
    };
  }
  return {
    ...base,
    title: "Check the fabric before donating it",
    steps: ["Clothes and linens stay out of the blue bin. Their condition determines whether they can be worn again or recycled as fiber."]
  };
}

const CYLINDER_TYPE: Question = {
  label: "What does the cylinder label say?",
  options: [
    { value: "camp", label: "1 lb propane" },
    { value: "grill", label: "Refillable grill propane" },
    { value: "other", label: "Other gas, large or unsure" }
  ]
};

function cylinders(name: string, choice?: string): SanDiegoGuidance {
  const base = { ...HHW, question: CYLINDER_TYPE, searchQueries: [] };
  if (/\b(?:leaking|hissing|smell of gas|gas odor)\b/.test(name)) {
    return {
      ...HHW,
      searchQueries: [],
      title: "Move away from the leaking cylinder",
      source: {
        label: "Propane Education & Research Council leak guidance",
        url: "https://propane.com/safety/safety-guide-for-propane-users/"
      },
      steps: ["Leave the area and call 911 from a safe distance. Do not transport the cylinder."]
    };
  }
  const size = name.match(/\b(\d+(?:\.\d+)?)[ -]?(gal(?:lon)?s?|lbs?|pounds?)\b/);
  const oversized = size && Number(size[1]) > (size[2].startsWith("gal") ? 5 : 20);
  const nonPropane = /\b(?:butane|isobutane|helium|oxygen|scuba|acetylene|refrigerant|co2|carbon dioxide)\b/.test(name);
  if (choice === "other" || nonPropane || oversized) {
    return {
      ...base,
      question: nonPropane || oversized ? undefined : CYLINDER_TYPE,
      title: "Confirm the gas and size before a trip",
      steps: [
        "Miramar has separate restrictions for compressed gases and containers over five gallons. Read the label to Environmental Services.",
        CALL_CITY
      ]
    };
  }
  if (choice === "camp" || (!choice && /\b(?:1|one)[ -]?(?:lb|pound)s?\b/.test(name) && /\bpropane\b/.test(name))) {
    return {
      ...base,
      title: "Book a drop-off for the small propane cylinder",
      steps: [
        "Even if it feels empty, leave the cylinder intact and keep it out of every curbside bin.",
        CITY_APPOINTMENT
      ]
    };
  }
  if (choice === "grill" || (!choice && /\b(?:grill|barbecue|bbq|20[ -]?(?:lb|pound)s?)\b/.test(name) && /\bpropane\b/.test(name))) {
    return {
      ...base,
      title: "Ask a propane exchange about the grill tank",
      steps: [
        "Call a propane exchange with the tank size. Confirm whether they take returns if you do not need a replacement.",
        "City residents can also check Miramar’s appointment and container-size requirements."
      ],
      searchQueries: ["propane grill tank exchange"]
    };
  }
  return {
    ...base,
    title: "Check the label on the gas cylinder",
    steps: ["Keep the cylinder out of curbside bins. A small propane cartridge, a refillable grill tank and a cylinder of another gas have different return options."]
  };
}

const BATTERY_TYPE: Question = {
  label: "Which describes the battery?",
  options: [
    { value: "household", label: "Intact household cell" },
    { value: "vehicle", label: "Lead-acid starter battery" },
    { value: "ebike", label: "E-bike pack" },
    { value: "damaged", label: "Damaged, leaking or swollen" },
    { value: "other", label: "Other or unsure" }
  ]
};

function batteries(name: string, material: string, choice?: string): SanDiegoGuidance {
  const base = { ...HHW, question: BATTERY_TYPE, searchQueries: [] };
  if (choice === "damaged" || hasBatteryDamage(name)) {
    return {
      ...base,
      question: hasBatteryDamage(name) ? undefined : BATTERY_TYPE,
      title: "Get handling instructions before moving it",
      steps: [
        "Keep it out of collection boxes. Miramar excludes swollen or reacting batteries.",
        "If it is smoking or hot, move away and call 911. Otherwise call 858-694-7000 for disposal instructions."
      ]
    };
  }
  if (/\b(?:ev|hybrid|traction|electric vehicle|electric car|e[- ]?scooter|electric scooter|hoverboard)\b/.test(name)) {
    return {
      ...HHW,
      title: "Contact the manufacturer about this pack",
      searchQueries: [],
      steps: [
        "Give the manufacturer the model and condition before moving it. Household battery boxes are for small consumer cells.",
        CALL_CITY
      ]
    };
  }
  const kind = resolveDropoffKind({ item: name });
  // A generic “battery” does not establish cell size, chemistry or host device.
  const small = /\b(?:aa|aaa|9[ -]?v(?:olt)?|alkaline|button|coin|c[- ]cell|d[- ]cell)\b/.test(name + " " + material);
  if (choice === "vehicle" || (!choice && (kind === "vehicle" || /\blead[- ]acid\b/.test(material)))) {
    return {
      ...base,
      title: "Contact an auto battery retailer",
      steps: ["Call an auto-parts retailer to confirm take-back for your starter battery. Library battery boxes are for small household cells."],
      source: {
        label: "City vehicle battery take-back guidance",
        url: "https://www.sandiego.gov/environmental-services/geninfo/faq/hazardous"
      },
      searchQueries: ["automotive lead-acid battery take-back"],
      lookupItem: "lead-acid starter battery"
    };
  }
  if (choice === "ebike" || (!choice && kind === "ebike" && /\b(?:e[- ]?bike|electric (?:bike|bicycle))\b/.test(name))) {
    return {
      ...base,
      title: "Contact a participating e-bike retailer",
      steps: ["Give the shop the brand and model of the pack. The e-bike program covers participating brands. Confirm acceptance before bringing the pack."],
      source: { label: "E-bike battery recycling program", url: "https://www.hungryforbatteries.org/" },
      searchQueries: ["e-bike battery recycling bike shop"],
      lookupItem: "e-bike battery"
    };
  }
  if (choice === "household" || (!choice && small)) {
    return {
      ...base,
      title: "Recycle intact household cells at a battery drop-off",
      steps: ["For intact cells, tape the terminals and confirm the site accepts your battery type. If the cell is leaking, swollen or damaged, select that condition before choosing a site."],
      source: COUNTY_BATTERIES,
      searchQueries: ["household battery recycling drop-off"],
      lookupItem: "intact household battery"
    };
  }
  return {
    ...base,
    title: "Identify the battery before choosing a drop-off",
    steps: ["Keep it out of curbside bins. Check its label, the device it powered and its condition. For an unfamiliar pack, contact the manufacturer or Environmental Services at 858-694-7000."]
  };
}

const FABRIC = /\b(?:fabrics?|textiles?|cloth|clothes|clothing|garments?|t[- ]?shirts?|shirts?|jeans|pants|shorts|jackets?|sweaters?|hoodies?|socks?|dresses?|towels?|linens?|bedsheets?|bed sheets?|blankets?|rags?|shoes?)\b/;
const CYLINDER = /\b(?:cylinders?|cani[ns]ters?|tanks?|cartridges?|bottles?)\b/;
const GAS = /\b(?:propane|butane|isobutane|helium|oxygen|scuba|acetylene|co2|carbon dioxide|compressed gas|camp(?:ing)? (?:gas|fuel)|gas)\b/;
const BATTERY = /\b(?:batter(?:y|ies)|power ?banks?|portable charger|coin cells?|button cells?)\b/;

const BULB_TYPE: Question = {
  label: "What type of bulb is it?",
  options: [
    { value: "led-cfl", label: "LED or fluorescent" },
    { value: "incandescent", label: "Incandescent" },
    { value: "unknown-bulb", label: "Not sure" }
  ]
};

function lightBulbs(name: string, choice?: string): SanDiegoGuidance {
  const base = { ...HHW, searchQueries: [], question: BULB_TYPE };
  if (/\b(?:broken|cracked|shattered)\b/.test(name)) {
    return {
      ...base,
      question: undefined,
      title: "Check the label before handling broken glass",
      steps: [
        "If it is fluorescent or marked CFL, follow the City’s link to its fluorescent bulb handling instructions.",
        CALL_CITY
      ]
    };
  }
  const fluorescentOrLed = /\b(?:led|cfls?|fluorescent)\b/.test(name);
  if (fluorescentOrLed || choice === "led-cfl") {
    return {
      ...base,
      question: fluorescentOrLed ? undefined : BULB_TYPE,
      title: "Book a drop-off for the bulb",
      steps: [
        "San Diego accepts LED bulbs and fluorescent lamps, including CFLs, through its hazardous waste program.",
        CITY_APPOINTMENT
      ]
    };
  }
  if (choice === "incandescent" || (!choice && /\bincandescent\b/.test(name))) {
    return {
      ...base,
      ...GRAY,
      source: CITY_HHW,
      title: "Put an incandescent bulb in the gray bin",
      steps: ["Protect against cuts from broken glass. Use the hazardous waste program for CFL, fluorescent and LED bulbs."]
    };
  }
  return {
    ...base,
    title: "Check the writing on the bulb",
    steps: ["LED and fluorescent bulbs need a separate collection. If you cannot read the label, call Environmental Services at 858-694-7000."]
  };
}

type BinRule = { matches: RegExp; guidance: Omit<SanDiegoGuidance, "searchQueries"> };

const BIN_RULES: BinRule[] = [
  {
    matches: /\b(?:compostable|biodegradable)\b.*\b(?:bags?|liners?|cups?|pods?|plates?|straws?|forks?|utensils?|plastic|containers?)\b/,
    guidance: {
      ...GRAY,
      title: "Put the compostable product in the gray bin",
      steps: ["San Diego’s green bin takes food, yard trimmings and food-soiled paper. Disposable products labeled compostable or biodegradable go in the trash."]
    }
  },
  {
    matches: /\b(?:plastic (?:grocery |shopping |produce |sandwich )?(?:bags?|wrap|film|straws?|utensils?|forks?|spoons?)|cling (?:film|wrap)|(?:chip|snack) bags?|(?:candy|food) wrappers?)\b/,
    guidance: {
      ...GRAY,
      title: "Put this in the gray trash bin",
      steps: ["Flexible plastic film and disposable plastic cutlery stay out of San Diego’s blue and green bins."]
    }
  },
  {
    matches: /\b(?:wine glass(?:es)?|drinking glass(?:es)?|ceramic (?:mugs?|plates?|bowls?))\b/,
    guidance: {
      ...GRAY,
      title: "Put broken or unusable dishware in the gray bin",
      steps: ["The blue bin accepts glass bottles and jars. Give usable drinking glasses and dishes to someone who can use them."]
    }
  },
  {
    matches: /\bshredded paper\b/,
    guidance: {
      ...BLUE,
      title: "Bag the shreds in paper for the blue bin",
      steps: ["Close the paper bag to keep the shreds together."]
    }
  },
  {
    matches: /\b(?:cardboard boxes|cardboard box|corrugated cardboard)\b/,
    guidance: {
      ...BLUE,
      title: "Flatten clean cardboard for the blue bin",
      steps: ["Remove contents, liners and packing film. Flatten the clean, dry cardboard before putting it in the cart."]
    }
  },
  {
    matches: /\b(?:(?:plastic|glass) (?:water |soda |beverage |food |drink )?(?:bottles?|jars?)|(?:soda|beer|soup|beverage|aluminum|aluminium|steel) cans?|milk cartons?)\b/,
    guidance: {
      ...BLUE,
      title: "Empty, dry and recycle the container",
      steps: ["Remove food or liquid and place the container loose in the blue bin."],
      source: CITY_CURBSIDE
    }
  },
  {
    matches: /\b(?:food scraps?|banana(?:s| peels?)?|apple cores?|eggshells?|coffee grounds?|yard trimmings?|grass clippings?|food[- ]soiled (?:paper(?: (?:towels?|napkins?))?|napkins?))\b/,
    guidance: {
      ...GREEN,
      title: "Put the scraps in the green bin",
      steps: ["Remove stickers and packaging. Empty the scraps directly into the cart or use a paper bag. Plastic and compostable liners go in the gray bin."]
    }
  }
];

/** Matches the identified object, without treating model-proposed destinations as local evidence. */
export function getSanDiegoGuidance(item: GuidanceInput, choice?: string): SanDiegoGuidance | undefined {
  const name = item.name.trim().toLowerCase().replace(/[‐‑‒–—]/g, "-");
  const material = (item.material ?? "").toLowerCase();
  if (!name) return undefined;
  if ((CYLINDER.test(name) || name === "propane") && GAS.test(name) && !/\b(?:regulator|gauge|hose|handle|stand|holder|strap)\b/.test(name)) return cylinders(name, choice);
  if (BATTERY.test(name) && !/\bbattery[- ]powered\b|\bbattery (?:charger|cable|case|holder|cover|compartment|tester)\b/.test(name)) {
    return batteries(name, material, choice);
  }
  if (/\b(?:light ?bulbs?|(?:led|cfl|fluorescent|incandescent) (?:bulbs?|tubes?)|cfls?)\b/.test(name)) {
    return lightBulbs(name, choice);
  }
  // Paper towels and fabric-covered furniture are different waste streams from linens.
  if (FABRIC.test(name) && !/\b(?:paper|disposable|wipes?|chair|sofa|couch|mattress|upholster\w*|softener|conditioner|dispenser|detergent)\b/.test(name)) {
    return textiles(name, choice);
  }
  if (/\b(?:pesticide|solvent|gasoline|antifreeze|motor oil|paint thinner|bleach|chemical)\b/.test(name)) {
    return {
      ...HHW,
      title: "Check hazardous product and container disposal",
      steps: [
        "Read the product name and tell Environmental Services whether any residue remains.",
        CALL_CITY
      ],
      searchQueries: []
    };
  }
  // Avoid treating a package as its contents or dirty cardboard as clean fiber.
  const packaging = /\b(?:bags?|wrappers?|boxes?|cartons?|containers?|bottles?|jars?|cans?|packaging)\b/.test(name);
  const matched = BIN_RULES.find(({ matches, guidance }) =>
    matches.test(name) && !(guidance.bin === BIN_GREEN && packaging)
  );
  if (matched?.guidance.bin === BIN_BLUE && /\b(?:oily|greasy|soiled|contaminated|paint|chemical|aerosol|pressurized|pressurised|spray)\b/.test(name)) return undefined;
  if (matched) return { ...matched.guidance, searchQueries: [] };
  // The vision response often separates a generic object name and its material.
  if (/^(?:bottles?|jars?)$/.test(name) && /^(?:pet|hdpe|glass|plastic)(?: plastic)?$/.test(material.trim())) {
    return {
      ...BLUE,
      title: "Empty, dry and recycle the container",
      steps: ["For a food or drink container, place it loose in the blue bin. A container used for chemicals needs separate guidance."],
      searchQueries: []
    };
  }
  return undefined;
}
