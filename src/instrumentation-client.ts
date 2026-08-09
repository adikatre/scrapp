const apiKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

async function initializeAnalytics() {
  if (!apiKey) return;
  const { default: posthog } = await import("posthog-js/dist/module.slim");
  posthog.init(apiKey, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    disable_surveys: true,
    advanced_disable_feature_flags: true,
    debug: process.env.NODE_ENV === "development",
    opt_out_capturing_by_default: false,
    respect_dnt: true,
    defaults: "2026-05-30",
    persistence: "localStorage"
  });
}

if (apiKey) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => void initializeAnalytics(), { timeout: 4_000 });
  } else {
    setTimeout(() => void initializeAnalytics(), 2_000);
  }
}
