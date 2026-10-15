import { describe, expect, it } from "vitest";
import { parseCurrencySeedJson } from "@/app/lib/currencySeed";

describe("parseCurrencySeedJson", () => {
  it("refuses a currency whose exchange value is missing or not a positive whole number", () => {
    const rows = [
      { name: "NORD", imageKey: "currencies-nord.png" },
      { name: "NORD", imageKey: "currencies-nord.png", exchangeValue: null },
      { name: "NAS", imageKey: "currencies-nas.png", exchangeValue: 0 },
      { name: "HUMF", imageKey: "currencies-humf.png", exchangeValue: -2 },
      { name: "MRARK", imageKey: "currencies-mrark.png", exchangeValue: 1.5 },
      { name: "NORD", imageKey: "currencies-nord.png", exchangeValue: "3" },
    ];

    for (const row of rows) {
      expect(() => parseCurrencySeedJson(JSON.stringify([row]))).toThrow(
        /positive whole number/
      );
    }
  });

  it("reads a name, a positive whole exchange value, and an image key", () => {
    expect(
      parseCurrencySeedJson(
        JSON.stringify([
          {
            name: "CONF",
            exchangeValue: 1,
            imageKey: "currencies-conf.png",
          },
          {
            name: "  NORD  ",
            exchangeValue: 12,
            imageKey: " currencies-nord.png ",
          },
        ])
      )
    ).toEqual([
      {
        name: "CONF",
        exchangeValue: 1,
        imageKey: "currencies-conf.png",
      },
      {
        name: "NORD",
        exchangeValue: 12,
        imageKey: "currencies-nord.png",
      },
    ]);
  });
});
