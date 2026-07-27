/**
 * Rate limiting for Server Actions
 * Uses Upstash Redis in production, falls back to in-memory for development
 */

import {Ratelimit} from "@upstash/ratelimit";
import {Redis} from "@upstash/redis";

// Check if Upstash credentials are available
const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// Create Redis client only if credentials exist
const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    })
  : null;

// Scan rate limiter: 10 scans per minute per IP (adjust as needed)
// Uses Upstash in production, in-memory fallback in development
export const scanRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "scrapp:scan"
    })
  : null;

// Places search rate limiter: 30 searches per minute per IP
export const placesRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      analytics: true,
      prefix: "scrapp:places"
    })
  : null;

// Photo proxy rate limiter: 30 requests per minute per IP
export const photoRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      analytics: true,
      prefix: "scrapp:photo"
    })
  : null;

/**
 * In-memory rate limiter fallback for development
 * Note: This doesn't work across multiple instances
 */
export class InMemoryRateLimiter {
  private store = new Map<string, {count: number; resetTime: number}>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    // Cleanup interval
    if (typeof window === "undefined") {
      // Only run cleanup on server
      setInterval(() => {
        const now = Date.now();
        for (const [key, record] of this.store.entries()) {
          if (now > record.resetTime) {
            this.store.delete(key);
          }
        }
      }, 60000);
    }
  }

  async limit(key: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      this.store.set(key, {count: 1, resetTime: now + this.windowMs});
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: now + this.windowMs
      };
    }

    if (record.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: record.resetTime
      };
    }

    record.count++;
    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - record.count,
      reset: record.resetTime
    };
  }
}

// Create in-memory fallbacks for development
const scanRateLimitMemory = new InMemoryRateLimiter(10, 60000);
const placesRateLimitMemory = new InMemoryRateLimiter(30, 60000);
const photoRateLimitMemory = new InMemoryRateLimiter(30, 60000);

/**
 * Get the appropriate rate limiter (Upstash or in-memory)
 */
function getLimiter(upstashLimiter: Ratelimit | null, memoryLimiter: InMemoryRateLimiter) {
  return upstashLimiter ?? memoryLimiter;
}

/**
 * Check scan rate limit
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 */
export async function checkScanRateLimit(identifier: string) {
  const limiter = getLimiter(scanRateLimit, scanRateLimitMemory);
  return limiter.limit(identifier);
}

/**
 * Check places search rate limit
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 */
export async function checkPlacesRateLimit(identifier: string) {
  const limiter = getLimiter(placesRateLimit, placesRateLimitMemory);
  return limiter.limit(identifier);
}

/**
 * Check photo proxy rate limit
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 */
export async function checkPhotoRateLimit(identifier: string) {
  const limiter = getLimiter(photoRateLimit, photoRateLimitMemory);
  return limiter.limit(identifier);
}

/**
 * Extract client identifier from request
 * In production, use a more robust fingerprinting approach
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  const ip = cfConnectingIp ?? realIp ?? forwarded?.split(",")[0]?.trim() ?? "unknown";
  return ip;
}

/**
 * Validate uploaded image file
 * @param file - The uploaded file
 * @returns Error message if validation fails, null if valid
 */
export function validateImageFile(file: File): string | null {
  // Check file size (max 5 MB)
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB (max 5 MB)`;
  }

  // Check MIME type
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP`;
  }

  // Check file extension (basic check)
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const hasValidExtension = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
  if (!hasValidExtension && file.name !== "blob") {
    // blob is often used for camera captures
    return `Invalid file extension. Allowed: .jpg, .jpeg, .png, .webp`;
  }

  return null;
}
