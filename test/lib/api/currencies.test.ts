import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchCatalogueCurrencies,
  getCurrencies,
  getCurrency,
} from "@/lib/api/currencies";

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

const conf = {
  id: "conf",
  name: "CONF",
  imageKey: "currencies-conf.png",
  exchangeValue: 100,
};

describe("getCurrencies", () => {
  it("returns the parsed catalogue rows, including exchange value", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([conf])));

    await expect(getCurrencies()).resolves.toEqual([conf]);
  });

  it("rejects a currency missing its name", async () => {
    const { name: _name, ...withoutName } = conf;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse([withoutName]))
    );

    await expect(getCurrencies()).rejects.toThrow(/0\.name/);
  });
});

describe("getCurrency", () => {
  it("returns the parsed currency, including exchange value", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(conf)));

    await expect(getCurrency("conf")).resolves.toEqual(conf);
  });

  it("rejects a currency missing its exchange value", async () => {
    const { exchangeValue: _exchangeValue, ...withoutExchange } = conf;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(withoutExchange))
    );

    await expect(getCurrency("conf")).rejects.toThrow(/exchangeValue/);
  });
});
