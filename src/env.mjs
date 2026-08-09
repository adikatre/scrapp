import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Google Places API (server-side only)
    GOOGLE_PLACES_API_KEY: z.string().min(1, "Google Places API key is required"),

    // Backend configuration
    NEXT_PRIVATE_BACKEND_URL: z.url("Backend URL must be a valid URL"),
    BACKEND_API_KEY: z.string().min(1, "Backend API key is required"),

    // Upstash Redis for rate limiting (optional but recommended)
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional()
  },

  client: {
    // Google Maps JavaScript API (client-side, must be domain-restricted in GCP Console)
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1, "Google Maps API key is required"),

    // PostHog client key
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

    // Sentry client DSN
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional()
  },

  runtimeEnv: {
    // Server
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    NEXT_PRIVATE_BACKEND_URL: process.env.NEXT_PRIVATE_BACKEND_URL,
    BACKEND_API_KEY: process.env.BACKEND_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

    // Client
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN
  },
  // TypeScript: enable type-safe environment variable access
  // This makes process.env.GOOGLE_PLACES_API_KEY available with proper types
  emptyStringAsUndefined: true
});
