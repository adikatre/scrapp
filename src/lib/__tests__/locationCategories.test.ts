import { describe, it, expect } from 'vitest';
import {
  getCategoryByKey,
  routeToCategoryKey,
  resolveCategoryKey,
  getCurbsideBinInfo,
  buildSearchQuery,
  sanitizeSearchQueries,
  itemAffectsSearch,
  LOCATION_CATEGORIES,
} from '@/lib/locationCategories';

describe('locationCategories', () => {
  describe('getCategoryByKey', () => {
    it('returns category for valid key', () => {
      const category = getCategoryByKey('recycle');
      expect(category).toBeDefined();
      expect(category?.key).toBe('recycle');
      expect(category?.label).toBe('Recycling');
    });

    it('returns undefined for invalid key', () => {
      const category = getCategoryByKey('invalid');
      expect(category).toBeUndefined();
    });

    it('returns undefined for null/undefined', () => {
      expect(getCategoryByKey(null)).toBeUndefined();
      expect(getCategoryByKey(undefined)).toBeUndefined();
    });
  });

  describe('routeToCategoryKey', () => {
    it('maps backend routes to category keys', () => {
      expect(routeToCategoryKey('Recycle')).toBe('recycle');
      expect(routeToCategoryKey('Compost')).toBe('compost');
      expect(routeToCategoryKey('E-Waste')).toBe('e_waste');
      expect(routeToCategoryKey('Hazardous Waste')).toBe('hazardous');
      expect(routeToCategoryKey('Bulky Items (Donate)')).toBe('donation');
      expect(routeToCategoryKey('Single-Use Items')).toBe('single_use');
      expect(routeToCategoryKey('General Trash')).toBe('general_trash');
      expect(routeToCategoryKey('City Infrastructure')).toBe('city_infra');
      expect(routeToCategoryKey('Living Things')).toBe('living_things');
    });

    it('defaults to recycle for unknown routes', () => {
      expect(routeToCategoryKey('Unknown Route')).toBe('recycle');
    });
  });

  describe('resolveCategoryKey', () => {
    it('prioritizes curbside bin over route', () => {
      // Blue bin should map to recycle regardless of route
      expect(resolveCategoryKey('Landfill / Donate', 'Blue Bin (Recycling)')).toBe('recycle');
      expect(resolveCategoryKey('E-Waste', 'Blue Bin (Recycling)')).toBe('recycle');
    });

    it('uses route when no curbside bin', () => {
      expect(resolveCategoryKey('Hazardous Waste', 'Special Drop-off')).toBe('hazardous');
      expect(resolveCategoryKey('Compost', undefined)).toBe('compost');
    });

    it('handles green bin for compost', () => {
      expect(resolveCategoryKey('Recycle', 'Green Bin (Organics)')).toBe('compost');
    });

    it('handles gray bin for general trash', () => {
      expect(resolveCategoryKey('Recycle', 'Gray Bin (Trash)')).toBe('general_trash');
    });
  });

  describe('getCurbsideBinInfo', () => {
    it('returns info for blue bin', () => {
      const info = getCurbsideBinInfo('Blue Bin (Recycling)');
      expect(info).toBeDefined();
      expect(info?.categoryKey).toBe('recycle');
      expect(info?.note).toContain('blue recycling bin');
    });

    it('returns info for green bin', () => {
      const info = getCurbsideBinInfo('Green Bin (Organics)');
      expect(info).toBeDefined();
      expect(info?.categoryKey).toBe('compost');
      expect(info?.note).toContain('green food and yard bin');
    });

    it('returns info for gray bin', () => {
      const info = getCurbsideBinInfo('Gray Bin (Trash)');
      expect(info).toBeDefined();
      expect(info?.categoryKey).toBe('general_trash');
      expect(info?.note).toContain('gray trash bin');
    });

    it('returns undefined for special drop-off', () => {
      const info = getCurbsideBinInfo('Special Drop-off');
      expect(info).toBeUndefined();
    });

    it('returns undefined for null/undefined', () => {
      expect(getCurbsideBinInfo(null)).toBeUndefined();
      expect(getCurbsideBinInfo(undefined)).toBeUndefined();
    });
  });

  describe('buildSearchQuery', () => {
    const recycleCategory = getCategoryByKey('recycle')!;
    const hazardousCategory = getCategoryByKey('hazardous')!;

    it('builds query with location', () => {
      const query = buildSearchQuery(recycleCategory, 'San Diego, CA');
      expect(query).toContain('near San Diego, CA');
      expect(query).toContain('recycling center drop-off');
    });

    it('builds query without location when coordinates available', () => {
      const query = buildSearchQuery(recycleCategory, null);
      expect(query).not.toContain('near');
      expect(query).toContain('recycling center drop-off');
    });

    it('uses item-specific query for hazardous category when item matches', () => {
      const query = buildSearchQuery(hazardousCategory, 'San Diego, CA', 'battery');
      expect(query).toContain('battery');
      expect(query).toContain('recycling drop-off');
    });
  });

  describe('sanitizeSearchQueries', () => {
    it('sanitizes queries', () => {
      const queries = sanitizeSearchQueries(['battery recycling!', '  ewaste  drop-off  ']);
      expect(queries).toEqual(['battery recycling', 'ewaste drop-off']);
    });

    it('removes special characters', () => {
      const queries = sanitizeSearchQueries(['test@#$%', 'hello world!!!']);
      expect(queries).toEqual(['test', 'hello world']);
    });

    it('truncates long queries', () => {
      const longQuery = 'a'.repeat(100);
      const queries = sanitizeSearchQueries([longQuery]);
      expect(queries[0].length).toBeLessThanOrEqual(60);
    });

    it('deduplicates queries', () => {
      const queries = sanitizeSearchQueries(['same', 'same', 'different']);
      expect(queries).toEqual(['same', 'different']);
    });

    it('limits to MAX_ITEM_SEARCH_QUERIES', () => {
      const manyQueries = Array(10).fill('query');
      const queries = sanitizeSearchQueries(manyQueries);
      expect(queries.length).toBeLessThanOrEqual(4);
    });

    it('handles null/undefined/empty', () => {
      expect(sanitizeSearchQueries(null)).toEqual([]);
      expect(sanitizeSearchQueries(undefined)).toEqual([]);
      expect(sanitizeSearchQueries([])).toEqual([]);
      expect(sanitizeSearchQueries(['', '  ', 'valid'])).toEqual(['valid']);
    });
  });

  describe('itemAffectsSearch', () => {
    it('returns true for e_waste and hazardous with matching items', () => {
      expect(itemAffectsSearch('e_waste', 'battery')).toBe(true);
      expect(itemAffectsSearch('hazardous', 'paint')).toBe(true);
      expect(itemAffectsSearch('e_waste', 'light bulb')).toBe(true);
    });

    it('returns false for non-matching categories', () => {
      expect(itemAffectsSearch('recycle', 'battery')).toBe(false);
      expect(itemAffectsSearch('compost', 'paint')).toBe(false);
      expect(itemAffectsSearch('donation', 'battery')).toBe(false);
    });

    it('returns false for non-query categories', () => {
      expect(itemAffectsSearch('single_use', 'battery')).toBe(false);
      expect(itemAffectsSearch('general_trash', 'paint')).toBe(false);
    });
  });

  describe('LOCATION_CATEGORIES', () => {
    it('has all expected categories', () => {
      const keys = LOCATION_CATEGORIES.map(c => c.key);
      expect(keys).toContain('recycle');
      expect(keys).toContain('compost');
      expect(keys).toContain('e_waste');
      expect(keys).toContain('hazardous');
      expect(keys).toContain('donation');
      expect(keys).toContain('single_use');
      expect(keys).toContain('general_trash');
      expect(keys).toContain('city_infra');
      expect(keys).toContain('living_things');
    });

    it('has searchable categories with searchQuery', () => {
      const searchable = LOCATION_CATEGORIES.filter(c => c.searchable);
      const searchableKeys = searchable.map(c => c.key);
      expect(searchableKeys).toContain('recycle');
      expect(searchableKeys).toContain('compost');
      expect(searchableKeys).toContain('e_waste');
      expect(searchableKeys).toContain('hazardous');
      expect(searchableKeys).toContain('donation');
    });

    it('has non-searchable categories with infoMessage', () => {
      const nonSearchable = LOCATION_CATEGORIES.filter(c => !c.searchable);
      nonSearchable.forEach(cat => {
        expect(cat.infoMessage).toBeDefined();
        expect(cat.infoMessage!.length).toBeGreaterThan(0);
      });
    });
  });
});