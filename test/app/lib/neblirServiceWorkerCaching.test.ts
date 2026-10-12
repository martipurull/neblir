import { afterEach, describe, expect, it, vi } from "vitest";
import type { RuntimeCaching } from "serwist";

function networkTimeoutSeconds(handler: RuntimeCaching["handler"]): number {
  if (typeof handler === "function") return 0;
  const timeout = (handler as { _networkTimeoutSeconds?: number })
    ._networkTimeoutSeconds;
  return timeout ?? 0;
}

function firstMatchingHandler(
  routes: RuntimeCaching[],
  url: string,
  method: string
): RuntimeCaching["handler"] {
  const requestUrl = new URL(url);
  const request = new Request(url, { method });
  for (const route of routes) {
    if ((route.method ?? "GET") !== method) continue;
    const matcher = route.matcher;
    const matched =
      matcher instanceof RegExp
        ? matcher.test(requestUrl.href)
        : typeof matcher === "string"
          ? requestUrl.href === new URL(matcher, requestUrl.origin).href
          : Boolean(
              matcher({
                url: requestUrl,
                sameOrigin: requestUrl.origin === "https://www.neblir.com",
                request,
                event: undefined as never,
              })
            );
    if (matched) return route.handler;
  }
  throw new Error(`No runtime cache route matched ${method} ${url}`);
}

describe("service worker same-origin API timeout", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("does not apply the 10-second timeout to GET /api/staff/catalogue-sync", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const { defaultCache } = await import("@serwist/turbopack/worker");
    const { neblirRuntimeCaching } =
      await import("@/app/lib/neblirServiceWorkerCaching");
    const routes = neblirRuntimeCaching(defaultCache);
    const catalogueSync = firstMatchingHandler(
      routes,
      "https://www.neblir.com/api/staff/catalogue-sync?source=production&dest=development",
      "GET"
    );
    const otherApi = firstMatchingHandler(
      routes,
      "https://www.neblir.com/api/staff/catalogue-drift",
      "GET"
    );

    expect(networkTimeoutSeconds(catalogueSync)).toBe(0);
    expect(networkTimeoutSeconds(otherApi)).toBe(10);
  });
});
