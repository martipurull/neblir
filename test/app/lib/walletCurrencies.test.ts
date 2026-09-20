import { describe, expect, it } from "vitest";
import {
  CURRENCY_NAMES,
  currencyImageKey,
  getMissingWalletCurrencies,
} from "@/app/lib/types/item";

describe("getMissingWalletCurrencies", () => {
  it("returns every currency when the wallet is empty", () => {
    expect(getMissingWalletCurrencies([])).toEqual([...CURRENCY_NAMES]);
    expect(getMissingWalletCurrencies(null)).toEqual([...CURRENCY_NAMES]);
    expect(getMissingWalletCurrencies(undefined)).toEqual([...CURRENCY_NAMES]);
  });

  it("omits currencies already in the wallet", () => {
    expect(
      getMissingWalletCurrencies([
        { currencyName: "CONF" },
        { currencyName: "NAS" },
      ])
    ).toEqual(["NORD", "HUMF", "MRARK"]);
  });
});

describe("currencyImageKey", () => {
  it("builds the shared currency image key", () => {
    expect(currencyImageKey("CONF")).toBe("currencies-conf.png");
    expect(currencyImageKey("NORD")).toBe("currencies-nord.png");
    expect(currencyImageKey("NAS")).toBe("currencies-nas.png");
    expect(currencyImageKey("HUMF")).toBe("currencies-humf.png");
    expect(currencyImageKey("MRARK")).toBe("currencies-mrark.png");
  });
});
