/// <reference lib="webworker" />
// Service worker for the mobile app (/app). Built by @serwist/next into public/sw.js.
//
// What is cached:
//   - App shell: every /app page and its JS/CSS/fonts (precache), so the app opens with no signal.
//   - Map tiles you have already looked at (OpenStreetMap, cache-first, 1,500 tiles / 30 days).
//     Bulk-downloading an area is not allowed by the OSM tile usage policy, so unseen tiles need signal.
//   - App icons and species photos.
// Not cached here: Supabase API calls and weather. The app stores that data itself in IndexedDB (Dexie).

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const DAY = 24 * 60 * 60;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // /app/catch?id=… is served from the precached /app/catch page. Next's data requests (?_rsc=…) are NOT
  // matched, so they go to the network; offline, Next falls back to a full page load served from the precache.
  precacheOptions: { ignoreURLParametersMatching: [/^(?!_rsc$).+$/] },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.hostname === "tile.openstreetmap.org",
      handler: new CacheFirst({
        cacheName: "osm-tiles",
        plugins: [new ExpirationPlugin({ maxEntries: 1500, maxAgeSeconds: 30 * DAY, purgeOnQuotaError: true })],
      }),
    },
    {
      matcher: ({ request, url }) => request.mode === "navigate" && url.pathname.startsWith("/app"),
      handler: new NetworkFirst({ cacheName: "app-pages", networkTimeoutSeconds: 4 }),
    },
    {
      matcher: ({ url }) => url.origin === self.location.origin && (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/species/")),
      handler: new CacheFirst({
        cacheName: "app-images",
        plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 90 * DAY })],
      }),
    },
  ],
  fallbacks: {
    entries: [{ url: "/app/offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

serwist.addEventListeners();
