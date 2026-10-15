import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCatalogueCurrencies } from "@/lib/api/currencies";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchCatalogueCurrencies", () => {
  it("returns id, name, and image and omits exchange value", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse([
          {
            id: "conf",
            name: "CONF",
            imageKey: "currencies-conf.png",
            exchangeValue: 100,
          },
          {
            id: "humf",
            name: "HUMF",
            imageKey: "currencies-humf.png",
            exchangeValue: 158,
          },
        ])
      )
    );

    await expect(fetchCatalogueCurrencies("/api/currencies")).resolves.toEqual([
      { id: "conf", name: "CONF", imageKey: "currencies-conf.png" },
      { id: "humf", name: "HUMF", imageKey: "currencies-humf.png" },
    ]);
  });

  it("throws when a currency is missing its name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse([
          { id: "conf", name: "CONF", imageKey: "currencies-conf.png" },
          { id: "nord", imageKey: "currencies-nord.png" },
        ])
      )
    );

    await expect(fetchCatalogueCurrencies("/api/currencies")).rejects.toThrow(
      /1\.name/
    );
  });
});
