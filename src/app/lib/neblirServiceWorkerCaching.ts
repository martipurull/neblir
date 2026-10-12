import type { RuntimeCaching } from "serwist";
import {
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
} from "serwist";

const neblirApiCaching: RuntimeCaching[] = [
  {
    method: "GET",
    matcher: ({ url }: { url: URL }) =>
      url.pathname === "/api/staff/catalogue-sync",
    // Catalogue sync preview pulls the full Official snapshot and can exceed
    // the default 10-second same-origin API timeout.
    handler: new NetworkOnly(),
  },
  {
    method: "GET",
    matcher: ({ url }: { url: URL }) => url.pathname === "/api/image-url",
    // Signed image URL responses should never be served from service-worker cache.
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ url }: { url: URL }) =>
      url.hostname.endsWith(".r2.cloudflarestorage.com"),
    // Presigned object URLs expire; never cache them in the service worker.
    handler: new NetworkOnly(),
  },
  {
    method: "GET",
    matcher: ({ url }: { url: URL }) =>
      /^\/api\/(characters|paths|items|unique-items|games)(\/|$)/.test(
        url.pathname
      ),
    handler: new NetworkFirst({
      cacheName: "neblir-api-cache",
      networkTimeoutSeconds: 3,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
];

export function neblirRuntimeCaching(
  fallback: RuntimeCaching[]
): RuntimeCaching[] {
  return [...neblirApiCaching, ...fallback];
}
