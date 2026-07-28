import recyclablesJson from "./recyclables.json";

export type RecyclableCategory =
  | "Curbside Recyclable"
  | "Curbside Recyclable + Organics"
  | "Store Drop-Off"
  | "Scrap/Buy-Back"
  | "Household Hazardous Waste";

export type RecyclableItem = {
  item_name: string;
  category: RecyclableCategory;
  misconception_summary: string;
  the_truth: string;
  prep_steps: string[];
  where_to_take: string;
  impact_note: string;
  last_verified: string;
  short_user_tip: string;
};

export const recyclables = recyclablesJson as RecyclableItem[];
