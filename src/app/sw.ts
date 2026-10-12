/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { neblirRuntimeCaching } from "./lib/neblirServiceWorkerCaching";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: neblirRuntimeCaching(defaultCache),
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          if (request.destination !== "document") return false;
          const requestUrl = new URL(request.url);
          // Avoid masking API/auth navigations (e.g. OAuth redirects) as "offline".
          if (requestUrl.pathname.startsWith("/api/")) return false;
          return true;
        },
      },
    ],
  },
});

serwist.addEventListeners();
