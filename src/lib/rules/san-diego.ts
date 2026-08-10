import type { Jurisdiction, MaterialRule, RuleSource, ServiceProfile } from "./types";

export const SAN_DIEGO: Jurisdiction = {
  id: "us-ca-san-diego",
  country: "US",
  region: "California",
  municipality: "City of San Diego",
  timezone: "America/Los_Angeles",
  supportedLocales: ["en"],
  status: "supported"
};

export const SAN_DIEGO_CITY_HOME: ServiceProfile = {
  id: "sd-city-serviced-home",
  jurisdictionId: SAN_DIEGO.id,
  name: "City-serviced home",
  propertyType: "city-serviced-home",
  providerName: "City of San Diego Environmental Services"
};

export const SAN_DIEGO_UNKNOWN_SERVICE: ServiceProfile = {
  id: "sd-service-unknown",
  jurisdictionId: SAN_DIEGO.id,
  name: "Provider not confirmed",
  propertyType: "unknown"
};

export const SAN_DIEGO_SOURCES: RuleSource[] = [
  {
    id: "sd-what-goes-where",
    publisher: "City of San Diego Environmental Services",
    title: "What Goes Where and curbside recycling resources",
    url: "https://www.sandiego.gov/environmental-services/recycling",
    language: "en",
    lastChecked: "2026-08-09",
    verification: "official"
  },
  {
    id: "sd-household-hazardous-waste",
    publisher: "City of San Diego Environmental Services",
    title: "Household Hazardous Waste",
    url: "https://www.sandiego.gov/environmental-services/ep/hazardous",
    language: "en",
    lastChecked: "2026-08-09",
    verification: "official"
  }
];

const curbside = {
  sourceId: "sd-what-goes-where",
  jurisdictionId: SAN_DIEGO.id,
  serviceProfileIds: [SAN_DIEGO_CITY_HOME.id],
  effectiveFrom: "2026-01-01",
  priority: 100,
  status: "active" as const
};

const special = {
  sourceId: "sd-household-hazardous-waste",
  jurisdictionId: SAN_DIEGO.id,
  effectiveFrom: "2026-01-01",
  priority: 100,
  status: "active" as const
};

export const SAN_DIEGO_RULES: MaterialRule[] = [
  {
    ...curbside,
    id: "sd-plastic-bottle-v1",
    slug: "plastic-bottle",
    materialName: "Plastic bottle or jug",
    aliases: ["plastic bottle", "water bottle", "milk jug", "detergent bottle"],
    route: "recycle",
    bin: "Blue Bin (Recycling)",
    instruction: "Put it loose in the blue recycling bin.",
    preparation: ["Empty the container", "Rinse away food or liquid", "Replace the cap"],
    locationEligible: false
  },
  {
    ...curbside,
    id: "sd-metal-can-v1",
    slug: "metal-can",
    materialName: "Aluminum or steel can",
    aliases: ["aluminum can", "soda can", "steel can", "tin can", "food can"],
    route: "recycle",
    bin: "Blue Bin (Recycling)",
    instruction: "Put it loose in the blue recycling bin.",
    preparation: ["Empty the can", "Scrape or rinse away residue"],
    safety: ["If an aerosol can still contains product, use household hazardous waste instead"],
    locationEligible: false
  },
  {
    ...curbside,
    id: "sd-glass-container-v1",
    slug: "glass-bottle-jar",
    materialName: "Glass bottle or jar",
    aliases: ["glass bottle", "glass jar", "food jar", "beverage bottle"],
    route: "recycle",
    bin: "Blue Bin (Recycling)",
    instruction: "Put the empty container loose in the blue recycling bin.",
    preparation: ["Empty the container", "Replace metal or plastic lids"],
    exceptions: ["Drinking glasses, mirrors, ceramics, and broken dishware go in the gray bin"],
    locationEligible: false
  },
  {
    ...curbside,
    id: "sd-cardboard-v1",
    slug: "cardboard",
    materialName: "Cardboard",
    aliases: ["cardboard", "shipping box", "cereal box", "paperboard"],
    route: "recycle",
    bin: "Blue Bin (Recycling)",
    instruction: "Put clean, dry cardboard in the blue recycling bin.",
    preparation: ["Flatten boxes", "Remove plastic film and foam"],
    exceptions: ["Heavily food-soiled cardboard belongs in the green organics bin"],
    locationEligible: false
  },
  {
    ...curbside,
    id: "sd-food-scraps-v1",
    slug: "food-scraps",
    materialName: "Food scraps",
    aliases: [
      "food scraps",
      "leftovers",
      "fruit peel",
      "vegetable scraps",
      "bones",
      "coffee grounds"
    ],
    route: "compost",
    bin: "Green Bin (Organics)",
    instruction: "Put food scraps in the green organics bin.",
    preparation: ["Remove all plastic, glass, and metal", "Wrap wet scraps in paper if needed"],
    exceptions: ["Do not use plastic or compostable-plastic bags"],
    locationEligible: false
  },
  {
    ...curbside,
    id: "sd-food-soiled-paper-v1",
    slug: "food-soiled-paper",
    materialName: "Food-soiled paper",
    aliases: [
      "greasy paper",
      "paper towel",
      "napkin",
      "pizza box",
      "coffee filter",
      "parchment paper"
    ],
    route: "compost",
    bin: "Green Bin (Organics)",
    instruction: "Put food-soiled paper in the green organics bin.",
    preparation: ["Remove plastic liners, stickers, and utensils"],
    exceptions: ["Recycle clean sections of a pizza box in the blue bin"],
    locationEligible: false
  },
  {
    ...curbside,
    id: "sd-plastic-film-v1",
    slug: "plastic-film",
    materialName: "Plastic bag or film",
    aliases: [
      "plastic bag",
      "grocery bag",
      "plastic film",
      "shrink wrap",
      "bubble wrap",
      "bread bag"
    ],
    route: "trash",
    bin: "Gray Bin (Trash)",
    instruction: "Put it in the gray trash bin, never the blue recycling bin.",
    preparation: ["Contain loose film so it cannot blow away"],
    locationEligible: false
  },
  {
    ...curbside,
    id: "sd-compostable-plastic-v1",
    slug: "compostable-plastic",
    materialName: "Compostable or biodegradable plastic",
    aliases: ["compostable cup", "compostable bag", "biodegradable plastic", "compostable utensil"],
    route: "trash",
    bin: "Gray Bin (Trash)",
    instruction: "Put it in the gray trash bin.",
    preparation: ["Remove food scraps for the green bin first"],
    exceptions: ["San Diego's green bin does not accept compostable-plastic products"],
    locationEligible: false
  },
  {
    ...curbside,
    id: "sd-clean-foam-packaging-v1",
    slug: "foam-packaging",
    materialName: "Clean foam packaging",
    aliases: ["styrofoam packaging", "foam packaging", "packing foam", "clean styrofoam"],
    route: "recycle",
    bin: "Blue Bin (Recycling)",
    instruction: "In San Diego, put clean, dry foam packaging loose in the blue bin.",
    preparation: ["Remove tape, labels, and food residue", "Keep it dry and loose"],
    exceptions: ["Packing peanuts and food-soiled foam go in the gray bin"],
    locationEligible: false
  },
  {
    ...curbside,
    id: "sd-soiled-foam-v1",
    slug: "food-soiled-foam",
    materialName: "Food-soiled foam container",
    aliases: ["foam cup", "foam takeout box", "food soiled styrofoam", "packing peanuts"],
    route: "trash",
    bin: "Gray Bin (Trash)",
    instruction: "Put it in the gray trash bin.",
    preparation: ["Remove leftover food for the green bin"],
    locationEligible: false
  },
  {
    ...special,
    id: "sd-battery-v1",
    slug: "battery",
    materialName: "Battery",
    aliases: [
      "battery",
      "lithium battery",
      "button battery",
      "rechargeable battery",
      "alkaline battery"
    ],
    route: "hazardous-waste",
    bin: "Special Drop-off",
    instruction: "Keep every battery out of curbside bins and use a verified drop-off.",
    preparation: ["Tape exposed terminals", "Keep damaged batteries isolated"],
    safety: ["Do not place batteries in blue, green, or gray carts"],
    locationEligible: true,
    searchQueries: ["battery recycling drop-off", "household hazardous waste battery"]
  },
  {
    ...special,
    id: "sd-electronics-v1",
    slug: "electronics",
    materialName: "Electronics or cable",
    aliases: [
      "electronics",
      "phone",
      "laptop",
      "charger",
      "usb cable",
      "cord",
      "earbuds",
      "power adapter"
    ],
    route: "e-waste",
    bin: "Special Drop-off",
    instruction: "Use a verified electronics recycling or household hazardous waste program.",
    preparation: [
      "Remove personal data where possible",
      "Keep batteries attached unless the program says otherwise"
    ],
    locationEligible: true,
    searchQueries: ["electronics recycling", "e-waste drop-off"]
  },
  {
    ...special,
    id: "sd-paint-v1",
    slug: "paint",
    materialName: "Paint or household chemical",
    aliases: ["paint", "paint can", "solvent", "cleaner", "pesticide", "household chemical"],
    route: "hazardous-waste",
    bin: "Special Drop-off",
    instruction: "Use an approved household hazardous waste program.",
    preparation: ["Keep the product in its labeled container", "Transport it upright and sealed"],
    safety: ["Do not mix chemicals or pour them into a drain"],
    locationEligible: true,
    searchQueries: ["household hazardous waste", "paint recycling drop-off"]
  },
  {
    ...special,
    id: "sd-clothing-v1",
    slug: "clothing",
    materialName: "Clothing or textile",
    aliases: ["clothing", "clothes", "shoes", "textile", "shirt", "jeans"],
    route: "donate",
    bin: "Special Drop-off",
    instruction: "Donate usable items or use a verified textile collection program.",
    preparation: ["Keep items clean and dry", "Bag paired shoes together"],
    locationEligible: true,
    searchQueries: ["clothing donation center", "textile recycling"]
  }
];
