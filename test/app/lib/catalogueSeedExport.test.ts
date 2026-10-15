import { beforeEach, describe, expect, it, vi } from "vitest";

const currencyFindMany = vi.fn();

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    currency: {
      findMany: currencyFindMany,
    },
  },
}));

describe("buildCatalogueSeedDataExport", () => {
  beforeEach(() => {
    currencyFindMany.mockReset();
  });

  it("emits a currency's name, exchange value, and image key", async () => {
    currencyFindMany.mockResolvedValue([
      {
        id: "nord",
        name: "NORD",
        exchangeValue: 44,
        imageKey: "currencies-nord.png",
        protectedFromOfficialImport: true,
      },
    ]);

    const { buildCatalogueSeedDataExport } =
      await import("@/app/lib/catalogueSeedExport");
    const data = await buildCatalogueSeedDataExport(["currencies"]);

    expect(data.currencies).toEqual([
      {
        id: "nord",
        name: "NORD",
        exchangeValue: 44,
        imageKey: "currencies-nord.png",
      },
    ]);
  });
});
