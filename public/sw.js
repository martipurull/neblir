if (!self.define) {
  let e,
    s = {};
  const a = (a, t) => (
    (a = new URL(a + ".js", t).href),
    s[a] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = a), (e.onload = s), document.head.appendChild(e));
        } else ((e = a), importScripts(a), s());
      }).then(() => {
        let e = s[a];
        if (!e) throw new Error(`Module ${a} didn’t register its module`);
        return e;
      })
  );
  self.define = (t, i) => {
    const c =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[c]) return;
    let n = {};
    const r = (e) => a(e, c),
      u = { module: { uri: c }, exports: n, require: r };
    s[c] = Promise.all(t.map((e) => u[e] || r(e))).then((e) => (i(...e), n));
  };
}
define(["./workbox-d50ca814"], function (e) {
  "use strict";
  (importScripts("fallback-COHV3mD8ZdPJvQs1Hx66q.js"),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "e31bd9000f25842c25baafa5f08a8ab8",
        },
        {
          url: "/_next/static/COHV3mD8ZdPJvQs1Hx66q/_buildManifest.js",
          revision: "ba43a6da0fc72cfbc43d2a857197f6bb",
        },
        {
          url: "/_next/static/COHV3mD8ZdPJvQs1Hx66q/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/1255-d97c5e3be406639e.js",
          revision: "d97c5e3be406639e",
        },
        {
          url: "/_next/static/chunks/2619-38012e79151e370a.js",
          revision: "38012e79151e370a",
        },
        {
          url: "/_next/static/chunks/4bd1b696-f6bedae49f0827a5.js",
          revision: "f6bedae49f0827a5",
        },
        {
          url: "/_next/static/chunks/5653-84b67872ec6d91af.js",
          revision: "84b67872ec6d91af",
        },
        {
          url: "/_next/static/chunks/6199-fd7e5d52598952e3.js",
          revision: "fd7e5d52598952e3",
        },
        {
          url: "/_next/static/chunks/7244-dc235f10be8148df.js",
          revision: "dc235f10be8148df",
        },
        {
          url: "/_next/static/chunks/7815-8bc4a9fcab14f4f9.js",
          revision: "8bc4a9fcab14f4f9",
        },
        {
          url: "/_next/static/chunks/app/(pages)/home/characters/%5Bid%5D/page-853a2591f5474fec.js",
          revision: "853a2591f5474fec",
        },
        {
          url: "/_next/static/chunks/app/(pages)/home/characters/page-87d3a07b5df5ffcc.js",
          revision: "87d3a07b5df5ffcc",
        },
        {
          url: "/_next/static/chunks/app/(pages)/home/dice-roller/page-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/(pages)/home/games/page-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/(pages)/home/layout-bca911f0fb4a87d9.js",
          revision: "bca911f0fb4a87d9",
        },
        {
          url: "/_next/static/chunks/app/(pages)/home/mechanics/page-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/(pages)/home/page-cbde93359042aa77.js",
          revision: "cbde93359042aa77",
        },
        {
          url: "/_next/static/chunks/app/(pages)/home/settings/page-e646f7680aa8cbe8.js",
          revision: "e646f7680aa8cbe8",
        },
        {
          url: "/_next/static/chunks/app/(pages)/home/world/page-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/(pages)/signin/page-349bf2fbc85a1de8.js",
          revision: "349bf2fbc85a1de8",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-0b4273e7e0c28c6e.js",
          revision: "0b4273e7e0c28c6e",
        },
        {
          url: "/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/characters/%5Bid%5D/available-features/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/characters/%5Bid%5D/combat-info/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/characters/%5Bid%5D/general-info/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/characters/%5Bid%5D/health/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/characters/%5Bid%5D/inventory/%5BitemCharacterId%5D/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/characters/%5Bid%5D/inventory/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/characters/%5Bid%5D/level-up/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/characters/%5Bid%5D/notes/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/characters/%5Bid%5D/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/characters/%5Bid%5D/wallet/add/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/characters/%5Bid%5D/wallet/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/characters/%5Bid%5D/wallet/subtract/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/characters/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/games/%5Bid%5D/custom-items/%5BcustomItemId%5D/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/games/%5Bid%5D/custom-items/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/games/%5Bid%5D/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/games/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/image-url/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/items/%5Bid%5D/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/items/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/paths/%5Bid%5D/available-features/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/paths/%5Bid%5D/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/paths/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/unique-items/%5Bid%5D/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/unique-items/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/users/%5Bid%5D/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/users/me/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/api/users/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/layout-5c8ec3e896cd69c5.js",
          revision: "5c8ec3e896cd69c5",
        },
        {
          url: "/_next/static/chunks/app/manifest.webmanifest/route-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/offline/page-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/app/page-280f196675103667.js",
          revision: "280f196675103667",
        },
        {
          url: "/_next/static/chunks/framework-f31701c9d93f12a4.js",
          revision: "f31701c9d93f12a4",
        },
        {
          url: "/_next/static/chunks/main-app-2174ad26bf5a4c1c.js",
          revision: "2174ad26bf5a4c1c",
        },
        {
          url: "/_next/static/chunks/main-c32187b9b7165cc0.js",
          revision: "c32187b9b7165cc0",
        },
        {
          url: "/_next/static/chunks/pages/_app-6c8c2371b16a04b8.js",
          revision: "6c8c2371b16a04b8",
        },
        {
          url: "/_next/static/chunks/pages/_error-94812ad32cad7365.js",
          revision: "94812ad32cad7365",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-e3dda035a6761e3d.js",
          revision: "e3dda035a6761e3d",
        },
        {
          url: "/_next/static/css/6f57b85cc7d49dcf.css",
          revision: "6f57b85cc7d49dcf",
        },
        {
          url: "/icons/apple-touch-icon.png",
          revision: "7b76257dae02c48aea41148323634b32",
        },
        {
          url: "/icons/icon-192x192.png",
          revision: "1b27fc4cd644f076e9e354d450138e20",
        },
        {
          url: "/icons/icon-512x512.png",
          revision: "f77526b23eddd3ddca7ceda2592ff1d1",
        },
        { url: "/next.svg", revision: "8e061864f388b47f33a1c3780831193e" },
        { url: "/offline", revision: "COHV3mD8ZdPJvQs1Hx66q" },
        { url: "/vercel.svg", revision: "61c6b19abff40ea7acd577be818f3976" },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: a,
              state: t,
            }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: "OK",
                    headers: s.headers,
                  })
                : s,
          },
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https?.*\/api\/(characters|paths|items|unique-items|games)(\/.*)?$/,
      new e.NetworkFirst({
        cacheName: "neblir-api-cache",
        networkTimeoutSeconds: 3,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 86400 }),
          new e.CacheableResponsePlugin({ statuses: [0, 200] }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https?.*\.(?:js|css|woff2?|ttf|eot|otf)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "neblir-static-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 604800 }),
          new e.CacheableResponsePlugin({ statuses: [0, 200] }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https?.*\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
      new e.CacheFirst({
        cacheName: "neblir-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 2592e3 }),
          new e.CacheableResponsePlugin({ statuses: [0, 200] }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      "GET"
    ));
});
