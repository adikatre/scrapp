import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    GOOGLE_PLACES_API_KEY: z.string().min(1, "Google Places API key is required"),
    OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),
    OPENAI_MODEL: z.string().min(1).optional(),

    // Optional one-release rollback window for the retired Flask classifier.
    NEXT_PRIVATE_BACKEND_URL: z.url("Backend URL must be a valid URL").optional(),
    BACKEND_API_KEY: z.string().min(1).optional(),

    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional()
  },

  client: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1, "Google Maps API key is required"),
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional()
  },

  runtimeEnv: {
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    NEXT_PRIVATE_BACKEND_URL: process.env.NEXT_PRIVATE_BACKEND_URL,
    BACKEND_API_KEY: process.env.BACKEND_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN
  },
  emptyStringAsUndefined: true
});
