import type { MaterialDefinition } from "./types";

export const MATERIALS: MaterialDefinition[] = [
  {
    id: "plastic-bottle",
    name: "Plastic bottle or jug",
    aliases: ["plastic bottle", "water bottle", "milk jug", "detergent bottle"],
    packagingForms: ["bottle", "jug"]
  },
  {
    id: "metal-can",
    name: "Aluminum or steel can",
    aliases: ["aluminum can", "soda can", "steel can", "tin can", "food can"],
    packagingForms: ["can", "aerosol can"]
  },
  {
    id: "glass-bottle-jar",
    name: "Glass bottle or jar",
    aliases: ["glass bottle", "glass jar", "food jar", "beverage bottle"]
  },
  {
    id: "cardboard",
    name: "Cardboard",
    aliases: ["cardboard", "shipping box", "cereal box", "paperboard"]
  },
  {
    id: "food-scraps",
    name: "Food scraps",
    aliases: [
      "food scraps",
      "leftovers",
      "fruit peel",
      "vegetable scraps",
      "bones",
      "coffee grounds"
    ]
  },
  {
    id: "food-soiled-paper",
    name: "Food-soiled paper",
    aliases: [
      "greasy paper",
      "paper towel",
      "napkin",
      "pizza box",
      "coffee filter",
      "parchment paper"
    ]
  },
  {
    id: "plastic-film",
    name: "Plastic bag or film",
    aliases: [
      "plastic bag",
      "grocery bag",
      "plastic film",
      "shrink wrap",
      "bubble wrap",
      "bread bag"
    ]
  },
  {
    id: "compostable-plastic",
    name: "Compostable or biodegradable plastic",
    aliases: ["compostable cup", "compostable bag", "biodegradable plastic", "compostable utensil"]
  },
  {
    id: "foam-packaging",
    name: "Clean foam packaging",
    aliases: ["styrofoam packaging", "foam packaging", "packing foam", "clean styrofoam"]
  },
  {
    id: "food-soiled-foam",
    name: "Food-soiled foam container",
    aliases: ["foam cup", "foam takeout box", "food soiled styrofoam", "packing peanuts"]
  },
  {
    id: "battery",
    name: "Battery",
    aliases: [
      "battery",
      "lithium battery",
      "button battery",
      "rechargeable battery",
      "alkaline battery"
    ],
    hazards: ["stored electrical energy", "fire risk"]
  },
  {
    id: "electronics",
    name: "Electronics or cable",
    aliases: [
      "electronics",
      "phone",
      "laptop",
      "charger",
      "usb cable",
      "cord",
      "earbuds",
      "power adapter"
    ]
  },
  {
    id: "paint",
    name: "Paint or household chemical",
    aliases: ["paint", "paint can", "solvent", "cleaner", "pesticide", "household chemical"],
    hazards: ["household hazardous material"]
  },
  {
    id: "clothing",
    name: "Clothing or textile",
    aliases: ["clothing", "clothes", "shoes", "textile", "shirt", "jeans"]
  }
];
