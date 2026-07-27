import posthog from "posthog-js";

const apiKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

if (!apiKey) {
  throw new Error("[PostHog] NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN not set, analytics disabled");
}

posthog.init(apiKey, {
  api_host: host,
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: true,
  debug: process.env.NODE_ENV === "development",
  opt_out_capturing_by_default: false,
  respect_dnt: true,
  defaults: "2026-05-30",
  persistence: "localStorage"
});
