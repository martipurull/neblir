import { describe, expect, it } from "vitest";
import { currencyImageKey } from "@/app/lib/types/item";

describe("currencyImageKey", () => {
  it("builds the shared currency image key", () => {
    expect(currencyImageKey("CONF")).toBe("currencies-conf.png");
    expect(currencyImageKey("NORD")).toBe("currencies-nord.png");
    expect(currencyImageKey("NAS")).toBe("currencies-nas.png");
    expect(currencyImageKey("HUMF")).toBe("currencies-humf.png");
    expect(currencyImageKey("MRARK")).toBe("currencies-mrark.png");
  });
});
