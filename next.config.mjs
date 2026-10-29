import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";

// Static /app pages precached at install so the mobile app opens in airplane mode.
// Pages read their data on the device (Dexie), so the same HTML works for every user.
const APP_ROUTES = [
  "/app", "/app/login", "/app/offline", "/app/log", "/app/catches", "/app/catch", "/app/map",
  "/app/more", "/app/report", "/app/weather", "/app/gallery", "/app/pic", "/app/onboarding",
];
const revision = randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Registered by components/mobile/register-sw.tsx with scope "/app" (no trailing slash, so the bare
  // /app URL is covered too). @serwist/next always appends a slash, so its auto-register is off.
  register: false,
  scope: "/app/",
  // Never reload on reconnect: it would wipe a half-filled catch form.
  reloadOnOnline: false,
  cacheOnNavigation: false,
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: APP_ROUTES.map((url) => ({ url, revision })),
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSerwist(nextConfig);
