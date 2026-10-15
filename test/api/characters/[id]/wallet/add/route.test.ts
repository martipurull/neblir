import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/app/lib/prisma/client";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";
import { bindWalletMemory, createWalletMemory } from "../memory";

const userHasPlayControlMock = vi.fn();
const memory = createWalletMemory();

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  userHasPlayControl: userHasPlayControlMock,
}));

vi.mock("@/app/lib/prisma/client", async () => {
  const { createWalletPrismaDouble } = await import("../memory");
  return { prisma: createWalletPrismaDouble() };
});

const conf = {
  id: "conf",
  name: "CONF",
  imageKey: "currencies-conf.png",
  exchangeValue: 100,
};

describe("/api/characters/[id]/wallet/add POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memory.reset();
    bindWalletMemory(prisma as never, memory);
    userHasPlayControlMock.mockResolvedValue(true);
    memory.seedCurrency(conf);
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

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/characters/[id]/wallet/add/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({ currencyId: "conf", amount: 1 }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when the user does not have play control", async () => {
    userHasPlayControlMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/characters/[id]/wallet/add/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ currencyId: "conf", amount: 1 }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
    userHasPlayControlMock.mockResolvedValue(true);
    await expect(readWallet()).resolves.toEqual([]);
  });

  it("returns 400 when the body is invalid", async () => {
    const { POST } = await import("@/app/api/characters/[id]/wallet/add/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ currencyId: "conf", amount: 0 }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    await expect(readWallet()).resolves.toEqual([]);
  });

  it("returns 400 for an unknown currency and leaves the wallet unchanged", async () => {
    memory.seedHolding({
      characterId: "char-1",
      currencyId: "conf",
      quantity: 2,
    });
    const { POST } = await import("@/app/api/characters/[id]/wallet/add/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ currencyId: "missing", amount: 1 }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "Unknown currency",
    });
    await expect(readWallet()).resolves.toEqual([
      {
        currencyId: "conf",
        name: "CONF",
        imageKey: "currencies-conf.png",
        quantity: 2,
      },
    ]);
  });

  it("creates a holding for a catalogue currency the character does not hold", async () => {
    const { POST } = await import("@/app/api/characters/[id]/wallet/add/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ currencyId: "conf", amount: 4 }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      {
        currencyId: "conf",
        name: "CONF",
        imageKey: "currencies-conf.png",
        quantity: 4,
      },
    ]);
  });

  it("increases the holding when the character already has that currency", async () => {
    memory.seedHolding({
      characterId: "char-1",
      currencyId: "conf",
      quantity: 2,
    });
    const { POST } = await import("@/app/api/characters/[id]/wallet/add/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ currencyId: "conf", amount: 3 }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      {
        currencyId: "conf",
        name: "CONF",
        imageKey: "currencies-conf.png",
        quantity: 5,
      },
    ]);
  });
});
