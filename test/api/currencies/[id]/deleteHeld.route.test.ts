import { prisma } from "@/app/lib/prisma/client";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeParams } from "../../helpers";
import {
  bindWalletMemory,
  createWalletMemory,
} from "../../characters/[id]/wallet/memory";

const userIsSuperAdminMock = vi.fn();
const memory = createWalletMemory();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/lib/prisma/officialCatalogueImage", () => ({
  countOfficialRowsWithCatalogueImageKey: vi.fn().mockResolvedValue(0),
}));

vi.mock("@/app/lib/prisma/client", async () => {
  const { createWalletPrismaDouble } =
    await import("../../characters/[id]/wallet/memory");
  return { prisma: createWalletPrismaDouble() };
});

const nord = {
  id: "nord",
  name: "NORD",
  imageKey: "currencies-nord.png",
  exchangeValue: 44,
};

const conf = {
  id: "conf",
  name: "CONF",
  imageKey: "currencies-conf.png",
  exchangeValue: 100,
};

describe("DELETE /api/currencies/[id] when holdings exist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memory.reset();
    bindWalletMemory(prisma as never, memory);
    userIsSuperAdminMock.mockResolvedValue(true);
    memory.seedCurrency(nord);
    memory.seedCurrency(conf);
  });

  it("refuses to delete a currency a character holds, and that currency remains", async () => {
    memory.seedHolding({
      characterId: "char-1",
      currencyId: "nord",
      quantity: 4,
    });
    const { DELETE } = await import("@/app/api/currencies/[id]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "nord" })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      message: "A character holds this currency",
    });
    expect(memory.currencies.get("nord")).toEqual(nord);
    expect(memory.holdings).toEqual([
      { characterId: "char-1", currencyId: "nord", quantity: 4 },
    ]);
    expect(touchStaffCatalogueDrift).not.toHaveBeenCalled();
  });

  it("deletes a currency nobody holds while a holding of another currency remains", async () => {
    memory.seedHolding({
      characterId: "char-1",
      currencyId: "conf",
      quantity: 3,
    });
    const { DELETE } = await import("@/app/api/currencies/[id]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "nord" })
    );

    expect(response.status).toBe(204);
    expect(memory.currencies.has("nord")).toBe(false);
    expect(memory.currencies.get("conf")).toEqual(conf);
    expect(memory.holdings).toEqual([
      { characterId: "char-1", currencyId: "conf", quantity: 3 },
    ]);
    expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["currencies"]);
  });
});
