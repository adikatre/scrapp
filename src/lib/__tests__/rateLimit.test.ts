import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {
  checkPhotoRateLimit,
  checkPlacesRateLimit,
  checkScanRateLimit,
  getClientIdentifier,
  validateImageFile
} from "@/lib/rate-limit";

// Mock Request object for getClientIdentifier tests
const createMockRequest = (headers: Record<string, string>) => {
  return {
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null
    }
  } as unknown as Request;
};

describe("rate-limit", () => {
  describe("validateImageFile", () => {
    it("accepts valid JPEG file", () => {
      const file = new File(["fake image"], "test.jpg", {type: "image/jpeg"});
      Object.defineProperty(file, "size", {value: 1024 * 1024}); // 1 MB

      const error = validateImageFile(file);
      expect(error).toBeNull();
    });

    it("accepts valid PNG file", () => {
      const file = new File(["fake image"], "test.png", {type: "image/png"});
      Object.defineProperty(file, "size", {value: 1024 * 1024}); // 1 MB

      const error = validateImageFile(file);
      expect(error).toBeNull();
    });

    it("accepts valid WebP file", () => {
      const file = new File(["fake image"], "test.webp", {type: "image/webp"});
      Object.defineProperty(file, "size", {value: 1024 * 1024}); // 1 MB

      const error = validateImageFile(file);
      expect(error).toBeNull();
    });

    it("rejects file too large", () => {
      const file = new File(["fake image"], "test.jpg", {type: "image/jpeg"});
      Object.defineProperty(file, "size", {value: 6 * 1024 * 1024}); // 6 MB

      const error = validateImageFile(file);
      expect(error).toContain("too large");
      expect(error).toContain("6.0 MB");
    });

    it("rejects invalid MIME type", () => {
      const file = new File(["fake image"], "test.gif", {type: "image/gif"});
      Object.defineProperty(file, "size", {value: 1024 * 1024}); // 1 MB

      const error = validateImageFile(file);
      expect(error).toContain("Invalid file type");
    });

    it("rejects non-image files", () => {
      const file = new File(["fake pdf"], "test.pdf", {type: "application/pdf"});
      Object.defineProperty(file, "size", {value: 1024 * 1024}); // 1 MB

      const error = validateImageFile(file);
      expect(error).toContain("Invalid file type");
    });

    it("rejects invalid file extension", () => {
      const file = new File(["fake image"], "test.bmp", {type: "image/jpeg"});
      Object.defineProperty(file, "size", {value: 1024 * 1024}); // 1 MB

      const error = validateImageFile(file);
      expect(error).toContain("Invalid file extension");
    });

    it("accepts blob files (camera captures)", () => {
      const file = new File(["fake image"], "blob", {type: "image/jpeg"});
      Object.defineProperty(file, "size", {value: 1024 * 1024}); // 1 MB

      const error = validateImageFile(file);
      expect(error).toBeNull();
    });
  });

  describe("getClientIdentifier", () => {
    it("uses cf-connecting-ip header (Cloudflare)", () => {
      const req = createMockRequest({"cf-connecting-ip": "1.2.3.4"});
      expect(getClientIdentifier(req)).toBe("1.2.3.4");
    });

    it("uses x-real-ip header", () => {
      const req = createMockRequest({"x-real-ip": "5.6.7.8"});
      expect(getClientIdentifier(req)).toBe("5.6.7.8");
    });

    it("uses x-forwarded-for header (first IP)", () => {
      const req = createMockRequest({"x-forwarded-for": "9.10.11.12, 13.14.15.16"});
      expect(getClientIdentifier(req)).toBe("9.10.11.12");
    });

    it("falls back to unknown", () => {
      const req = createMockRequest({});
      expect(getClientIdentifier(req)).toBe("unknown");
    });

    it("prioritizes cf-connecting-ip over x-real-ip", () => {
      const req = createMockRequest({
        "cf-connecting-ip": "1.2.3.4",
        "x-real-ip": "5.6.7.8"
      });
      expect(getClientIdentifier(req)).toBe("1.2.3.4");
    });
  });

  // Skip rate limiter tests that require Upstash or have issues with the mock
  describe.skip("checkScanRateLimit", () => {
    it("returns allowed result", async () => {
      const result = await checkScanRateLimit("test-client");
      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
    });

    it("tracks different clients independently", async () => {
      const result1 = await checkScanRateLimit("client-1");
      const result2 = await checkScanRateLimit("client-2");
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe.skip("checkPlacesRateLimit", () => {
    it("returns allowed result", async () => {
      const result = await checkPlacesRateLimit("test-client");
      expect(result.success).toBe(true);
      expect(result.limit).toBe(30);
    });
  });

  describe.skip("checkPhotoRateLimit", () => {
    it("returns allowed result", async () => {
      const result = await checkPhotoRateLimit("test-client");
      expect(result.success).toBe(true);
      expect(result.limit).toBe(30);
    });
  });
});
