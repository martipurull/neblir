import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/app/lib/prisma/client";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";
import { bindWalletMemory, createWalletMemory } from "./memory";

const userHasPlayControlMock = vi.fn();
const memory = createWalletMemory();

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  userHasPlayControl: userHasPlayControlMock,
}));

vi.mock("@/app/lib/prisma/client", async () => {
  const { createWalletPrismaDouble } = await import("./memory");
  return { prisma: createWalletPrismaDouble() };
});

const conf = {
  id: "conf",
  name: "CONF",
  imageKey: "currencies-conf.png",
  exchangeValue: 100,
};
const nord = {
  id: "nord",
  name: "Northern",
  imageKey: "currencies-nord.png",
  exchangeValue: 44,
};
const mrark = {
  id: "mrark",
  name: "MRARK",
  imageKey: "currencies-mrark.png",
  exchangeValue: 4,
};
const aaa = {
  id: "aaa",
  name: "AAA",
  imageKey: "currencies-aaa.png",
  exchangeValue: 9,
};

describe("/api/characters/[id]/wallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memory.reset();
    bindWalletMemory(prisma as never, memory);
    userHasPlayControlMock.mockResolvedValue(true);
    memory.seedCurrency(conf);
    memory.seedCurrency(nord);
    memory.seedCurrency(mrark);
    memory.seedCurrency(aaa);
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import("@/app/api/characters/[id]/wallet/route");
      const response = await invokeRoute(
        GET,
        makeUnauthedRequest(),
        makeParams({ id: "char-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when the user does not have play control", async () => {
      userHasPlayControlMock.mockResolvedValue(false);
      const { GET } = await import("@/app/api/characters/[id]/wallet/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "char-1" })
      );
      expect(response.status).toBe(403);
    });

    it("lists image, quantity, and current name, CONF first then by stored name", async () => {
      memory.seedHolding({
        characterId: "char-1",
        currencyId: "nord",
        quantity: 3,
      });
      memory.seedHolding({
        characterId: "char-1",
        currencyId: "conf",
        quantity: 2,
      });
      memory.seedHolding({
        characterId: "char-1",
        currencyId: "mrark",
        quantity: 1,
      });
      memory.seedHolding({
        characterId: "char-1",
        currencyId: "aaa",
        quantity: 0,
      });
      const { GET } = await import("@/app/api/characters/[id]/wallet/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "char-1" })
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([
        {
          currencyId: "conf",
          name: "CONF",
          imageKey: "currencies-conf.png",
          quantity: 2,
        },
        {
          currencyId: "mrark",
          name: "MRARK",
          imageKey: "currencies-mrark.png",
          quantity: 1,
        },
        {
          currencyId: "nord",
          name: "Northern",
          imageKey: "currencies-nord.png",
          quantity: 3,
        },
      ]);
    });

    it("returns 500 when the wallet cannot be read", async () => {
      vi.mocked(prisma.characterCurrency.findMany).mockRejectedValue(
        new Error("db down")
      );
      const { GET } = await import("@/app/api/characters/[id]/wallet/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "char-1" })
      );
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toMatchObject({
        message: "Error fetching wallet",
      });
    });
  });

  describe("PATCH", () => {
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
      const { PATCH } = await import("@/app/api/characters/[id]/wallet/route");
      const response = await invokeRoute(
        PATCH,
        makeUnauthedRequest([]),
        makeParams({ id: "char-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when the user does not have play control", async () => {
      userHasPlayControlMock.mockResolvedValue(false);
      memory.seedHolding({
        characterId: "char-1",
        currencyId: "conf",
        quantity: 2,
      });
      const { PATCH } = await import("@/app/api/characters/[id]/wallet/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest([{ currencyId: "nord", quantity: 1 }]),
        makeParams({ id: "char-1" })
      );
      expect(response.status).toBe(403);
      userHasPlayControlMock.mockResolvedValue(true);
      await expect(readWallet()).resolves.toEqual([
        {
          currencyId: "conf",
          name: "CONF",
          imageKey: "currencies-conf.png",
          quantity: 2,
        },
      ]);
    });

    it("returns 400 for a duplicate currency and leaves the wallet unchanged", async () => {
      memory.seedHolding({
        characterId: "char-1",
        currencyId: "conf",
        quantity: 2,
      });
      const { PATCH } = await import("@/app/api/characters/[id]/wallet/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest([
          { currencyId: "conf", quantity: 4 },
          { currencyId: "conf", quantity: 1 },
        ]),
        makeParams({ id: "char-1" })
      );
      expect(response.status).toBe(400);
      await expect(readWallet()).resolves.toEqual([
        {
          currencyId: "conf",
          name: "CONF",
          imageKey: "currencies-conf.png",
          quantity: 2,
        },
      ]);
    });

    it("returns 400 for an unknown currency and leaves the wallet unchanged", async () => {
      memory.seedHolding({
        characterId: "char-1",
        currencyId: "conf",
        quantity: 2,
      });
      const { PATCH } = await import("@/app/api/characters/[id]/wallet/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest([{ currencyId: "missing", quantity: 1 }]),
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

    it("returns 400 for a negative quantity and leaves the wallet unchanged", async () => {
      memory.seedHolding({
        characterId: "char-1",
        currencyId: "conf",
        quantity: 2,
      });
      const { PATCH } = await import("@/app/api/characters/[id]/wallet/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest([{ currencyId: "conf", quantity: -1 }]),
        makeParams({ id: "char-1" })
      );
      expect(response.status).toBe(400);
      await expect(readWallet()).resolves.toEqual([
        {
          currencyId: "conf",
          name: "CONF",
          imageKey: "currencies-conf.png",
          quantity: 2,
        },
      ]);
    });

    it("returns 400 for an unknown currency even when its quantity is 0", async () => {
      memory.seedHolding({
        characterId: "char-1",
        currencyId: "conf",
        quantity: 2,
      });
      const { PATCH } = await import("@/app/api/characters/[id]/wallet/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest([{ currencyId: "missing", quantity: 0 }]),
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

    it("drops a quantity of 0 and stores the remaining holdings", async () => {
      memory.seedHolding({
        characterId: "char-1",
        currencyId: "conf",
        quantity: 2,
      });
      const { PATCH } = await import("@/app/api/characters/[id]/wallet/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest([
          { currencyId: "conf", quantity: 0 },
          { currencyId: "mrark", quantity: 4 },
          { currencyId: "nord", quantity: 1 },
        ]),
        makeParams({ id: "char-1" })
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([
        {
          currencyId: "mrark",
          name: "MRARK",
          imageKey: "currencies-mrark.png",
          quantity: 4,
        },
        {
          currencyId: "nord",
          name: "Northern",
          imageKey: "currencies-nord.png",
          quantity: 1,
        },
      ]);
    });
  });
});
