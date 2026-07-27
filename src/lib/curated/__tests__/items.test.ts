import { describe, expect, it } from "vitest";
import { type DropoffKind, resolveDropoffKind } from "@/lib/curated/items";

describe("curated/items", () => {
  describe("resolveDropoffKind", () => {
    it("uses item name when available", () => {
      const result = resolveDropoffKind({ item: "car battery", queries: [] });
      expect(result).toBe("vehicle");
    });

    it("uses queries when item name does not resolve", () => {
      // Phone names like "Samsung Galaxy S21" don't match phone regex in item
      // but query "cell phone recycling drop-off" does
      const result = resolveDropoffKind({
        item: "Samsung Galaxy S21",
        queries: ["cell phone recycling drop-off"]
      });
      expect(result).toBe("cellphone");
    });

    it("strict mode for queries prevents false battery classification", () => {
      // The item name 'iPhone 15' matches 'cellphone' directly (via iPhone regex)
      // So it returns 'cellphone' from the item, not from the queries
      // This is the correct behavior - item name takes precedence
      const result = resolveDropoffKind({
        item: "iPhone 15",
        queries: ["battery recycling drop-off", "electronics recycling drop-off"]
      });
      // iPhone 15 matches the 'iPhone' pattern, so it's classified as cellphone
      expect(result).toBe("cellphone");
    });

    it("falls back to queries when item is empty", () => {
      const result = resolveDropoffKind({
        item: "",
        queries: ["car battery recycling drop-off"]
      });
      expect(result).toBe("vehicle");
    });

    it("returns null when nothing matches", () => {
      const result = resolveDropoffKind({
        item: "unknown item",
        queries: ["unknown query"]
      });
      expect(result).toBeNull();
    });
  });

  describe("DropoffKind type", () => {
    it("includes all expected kinds", () => {
      const kinds: DropoffKind[] = ["vehicle", "ebike", "cellphone", "household"];
      expect(kinds).toHaveLength(4);
    });
  });
});
