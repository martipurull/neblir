import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/app/lib/prisma/client";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../../helpers";
import { bindWalletMemory, createWalletMemory } from "../../memory";

const userHasPlayControlMock = vi.fn();
const memory = createWalletMemory();

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  userHasPlayControl: userHasPlayControlMock,
}));

vi.mock("@/app/lib/prisma/client", async () => {
  const { createWalletPrismaDouble } = await import("../../memory");
  return { prisma: createWalletPrismaDouble() };
});

const chip = {
  id: "chip",
  name: "CHIP",
  imageKey: "currencies-chip.png",
  exchangeValue: 2,
};

const slab = {
  id: "slab",
  name: "SLAB",
  imageKey: "currencies-slab.png",
  exchangeValue: 10,
};

const heldChip = {
  currencyId: "chip",
  name: "CHIP",
  imageKey: "currencies-chip.png",
  quantity: 6,
};

describe("/api/characters/[id]/wallet/exchange/commit POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memory.reset();
    bindWalletMemory(prisma as never, memory);
    userHasPlayControlMock.mockResolvedValue(true);
    memory.seedCurrency(chip);
    memory.seedCurrency(slab);
    memory.seedHolding({
      characterId: "char-1",
      currencyId: "chip",
      quantity: 6,
    });
  });

  async function readWallet() {
    const { GET } = await import("@/app/api/characters/[id]/wallet/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "char-1" })
    );
    return response.json();
  }

  it("spends 5 and credits 1 destination unit, keeping the source holding", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/wallet/exchange/commit/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceCurrencyId: "chip",
        destinationCurrencyId: "slab",
        amount: 5,
      }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      wallet: [
        { ...heldChip, quantity: 1 },
        {
          currencyId: "slab",
          name: "SLAB",
          imageKey: "currencies-slab.png",
          quantity: 1,
        },
      ],
      sourceExchangeValue: 2,
      destinationExchangeValue: 10,
      destinationQuantity: 1,
    });
  });

  it("spends 6 and credits 1, removing the source holding", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/wallet/exchange/commit/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceCurrencyId: "chip",
        destinationCurrencyId: "slab",
        amount: 6,
      }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      wallet: [
        {
          currencyId: "slab",
          name: "SLAB",
          imageKey: "currencies-slab.png",
          quantity: 1,
        },
      ],
      sourceExchangeValue: 2,
      destinationExchangeValue: 10,
      destinationQuantity: 1,
    });
  });

  it("adds credited units to a destination the character already holds", async () => {
    memory.seedHolding({
      characterId: "char-1",
      currencyId: "slab",
      quantity: 3,
    });
    const { POST } =
      await import("@/app/api/characters/[id]/wallet/exchange/commit/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceCurrencyId: "chip",
        destinationCurrencyId: "slab",
        amount: 5,
      }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      wallet: [
        { ...heldChip, quantity: 1 },
        {
          currencyId: "slab",
          name: "SLAB",
          imageKey: "currencies-slab.png",
          quantity: 4,
        },
      ],
      destinationQuantity: 1,
    });
  });

  it("credits 2 CONF for 5 units at exchange value 44", async () => {
    memory.seedCurrency({
      id: "wide",
      name: "WIDE",
      imageKey: "currencies-wide.png",
      exchangeValue: 44,
    });
    memory.seedCurrency({
      id: "conf",
      name: "CONF",
      imageKey: "currencies-conf.png",
      exchangeValue: 100,
    });
    memory.holdings.splice(0, memory.holdings.length);
    memory.seedHolding({
      characterId: "char-1",
      currencyId: "wide",
      quantity: 5,
    });
    const { POST } =
      await import("@/app/api/characters/[id]/wallet/exchange/commit/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceCurrencyId: "wide",
        destinationCurrencyId: "conf",
        amount: 5,
      }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      wallet: [
        {
          currencyId: "conf",
          name: "CONF",
          imageKey: "currencies-conf.png",
          quantity: 2,
        },
      ],
      sourceExchangeValue: 44,
      destinationExchangeValue: 100,
      destinationQuantity: 2,
    });
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/wallet/exchange/commit/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({
        sourceCurrencyId: "chip",
        destinationCurrencyId: "slab",
        amount: 5,
      }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
    await expect(readWallet()).resolves.toEqual([heldChip]);
  });

  it("returns 403 when the user does not have play control", async () => {
    userHasPlayControlMock.mockResolvedValue(false);
    const { POST } =
      await import("@/app/api/characters/[id]/wallet/exchange/commit/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceCurrencyId: "chip",
        destinationCurrencyId: "slab",
        amount: 5,
      }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
    userHasPlayControlMock.mockResolvedValue(true);
    await expect(readWallet()).resolves.toEqual([heldChip]);
  });

  it("returns 400 when the source amount is not a positive whole number", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/wallet/exchange/commit/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceCurrencyId: "chip",
        destinationCurrencyId: "slab",
        amount: 1.5,
      }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    await expect(readWallet()).resolves.toEqual([heldChip]);
  });

  it("returns 400 for an unknown currency and leaves the wallet unchanged", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/wallet/exchange/commit/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceCurrencyId: "missing",
        destinationCurrencyId: "slab",
        amount: 5,
      }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "Unknown currency",
    });
    await expect(readWallet()).resolves.toEqual([heldChip]);
  });

  it("refuses exchanging a currency into itself and leaves the wallet unchanged", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/wallet/exchange/commit/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceCurrencyId: "chip",
        destinationCurrencyId: "chip",
        amount: 5,
      }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "A currency cannot be exchanged into itself",
    });
    await expect(readWallet()).resolves.toEqual([heldChip]);
  });

  it("refuses a source amount above the holding without a destination quantity", async () => {
    memory.holdings.splice(0, memory.holdings.length);
    memory.seedHolding({
      characterId: "char-1",
      currencyId: "chip",
      quantity: 1,
    });
    const { POST } =
      await import("@/app/api/characters/[id]/wallet/exchange/commit/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceCurrencyId: "chip",
        destinationCurrencyId: "slab",
        amount: 2,
      }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Insufficient funds",
    });
    await expect(readWallet()).resolves.toEqual([{ ...heldChip, quantity: 1 }]);
  });

  it("refuses a source amount that yields no whole destination unit and reports the minimum", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/wallet/exchange/commit/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceCurrencyId: "chip",
        destinationCurrencyId: "slab",
        amount: 1,
      }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "The smallest amount of CHIP that yields one SLAB is 5.",
      minimumSourceAmount: 5,
      sourceName: "CHIP",
      destinationName: "SLAB",
    });
    await expect(readWallet()).resolves.toEqual([heldChip]);
  });

  it("reports a minimum of 3 when one unit at exchange value 44 cannot buy one CONF", async () => {
    memory.seedCurrency({
      id: "wide",
      name: "WIDE",
      imageKey: "currencies-wide.png",
      exchangeValue: 44,
    });
    memory.seedCurrency({
      id: "conf",
      name: "CONF",
      imageKey: "currencies-conf.png",
      exchangeValue: 100,
    });
    memory.holdings.splice(0, memory.holdings.length);
    memory.seedHolding({
      characterId: "char-1",
      currencyId: "wide",
      quantity: 5,
    });
    const { POST } =
      await import("@/app/api/characters/[id]/wallet/exchange/commit/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceCurrencyId: "wide",
        destinationCurrencyId: "conf",
        amount: 1,
      }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "The smallest amount of WIDE that yields one CONF is 3.",
      minimumSourceAmount: 3,
      sourceName: "WIDE",
      destinationName: "CONF",
    });
    await expect(readWallet()).resolves.toEqual([
      {
        currencyId: "wide",
        name: "WIDE",
        imageKey: "currencies-wide.png",
        quantity: 5,
      },
    ]);
  });
});
