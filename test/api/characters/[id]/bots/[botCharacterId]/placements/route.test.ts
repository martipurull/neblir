import { getCarriedWeight } from "@/app/lib/carryWeightUtils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../../helpers";

type Holding = {
  id: string;
  characterId: string;
  botId: string;
  sourceType: "OFFICIAL" | "CUSTOM";
  currentHp: number;
  maxHpBonus: number;
  customName: string | null;
  notes: string | null;
};

type Stack = {
  id: string;
  characterId: string;
  itemId: string;
  sourceType: "GLOBAL_ITEM" | "UNIQUE_ITEM" | "CUSTOM_ITEM";
  quantity: number;
  itemLocation: string | null;
  customName: string | null;
  status: "FUNCTIONAL";
  isEquipped: boolean;
  equipSlots: string[];
  botEquipSlots?: string[];
  currentUses: number;
};

type InstallLink = {
  id: string;
  botCharacterId: string;
  itemCharacterId: string;
};

type CatalogueItem = {
  id: string;
  name: string;
  weight: number;
  botInstallable: boolean;
  equipSlotCost?: number | null;
  equipSlotTypes?: string[];
  vehicleMountable: boolean;
  maxUses: number | null;
  modifiesAttribute: null;
  modifiesSkill: null;
};

type UniqueRow = {
  id: string;
  sourceType: "GLOBAL_ITEM" | "STANDALONE";
  itemId: string | null;
  gameId: string | null;
  nameOverride: string | null;
  weightOverride: number | null;
  botInstallableOverride: boolean | null;
  vehicleMountableOverride: boolean | null;
  maxUsesOverride: number | null;
};

type BotRow = {
  id: string;
  accessType: "PLAYER";
  name: string;
  imageKey: null;
  description: string;
  confCost: number;
  usage: null;
  notes: null;
  maxHp: number;
  maxCargoWeightKg: number | null;
  maxInstalledItems: number | null;
  speed?: number;
  maxCarryWeight?: number;
  heightMetres?: number | null;
  weight?: number | null;
};

type CustomBotRow = {
  id: string;
  gameId: string;
  name: string;
  description: null;
  confCost: null;
  usage: null;
  notes: null;
  maxHp: number;
  membersCanModify: boolean;
  maxCargoWeightKg: number | null;
  maxInstalledItems: number | null;
  speed?: number;
  maxCarryWeight?: number;
};

const state = {
  holdings: [] as Holding[],
  items: [] as Stack[],
  links: [] as InstallLink[],
  catalogue: new Map<string, CatalogueItem>(),
  unique: new Map<string, UniqueRow>(),
  bots: new Map<string, BotRow>(),
  customBots: new Map<string, CustomBotRow>(),
  characters: new Set<string>(),
};

let nextId = 1;

const playControlMock = vi.fn();
const characterIsInGameMock = vi.fn();

function matches(
  row: object,
  where: Record<string, unknown> | undefined
): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, expected]) => {
    const actual = (row as Record<string, unknown>)[key];
    if (
      expected != null &&
      typeof expected === "object" &&
      "in" in expected &&
      Array.isArray((expected as { in: unknown[] }).in)
    ) {
      return (expected as { in: unknown[] }).in.includes(actual);
    }
    return actual === expected;
  });
}

function applyUpdate<T extends { id: string }>(
  rows: T[],
  where: { id: string },
  data: Record<string, unknown>
): T {
  const row = rows.find((entry) => entry.id === where.id);
  if (!row) throw new Error(`Missing row ${where.id}`);
  for (const [key, value] of Object.entries(data)) {
    if (
      key === "quantity" &&
      value != null &&
      typeof value === "object" &&
      "increment" in value
    ) {
      (row as unknown as { quantity: number }).quantity += (
        value as { increment: number }
      ).increment;
      continue;
    }
    (row as Record<string, unknown>)[key] = value;
  }
  return row;
}

const prisma = {
  botCharacter: {
    findMany: async (args: { where?: Record<string, unknown> }) =>
      state.holdings.filter((row) => matches(row, args.where)),
    findFirst: async (args: { where?: Record<string, unknown> }) =>
      state.holdings.find((row) => matches(row, args.where)) ?? null,
    create: async (args: {
      data: Omit<Holding, "id" | "sourceType"> & {
        sourceType?: Holding["sourceType"];
      };
    }) => {
      const row: Holding = {
        id: `hold-${nextId++}`,
        sourceType: args.data.sourceType ?? "OFFICIAL",
        characterId: args.data.characterId,
        botId: args.data.botId,
        currentHp: args.data.currentHp,
        maxHpBonus: args.data.maxHpBonus ?? 0,
        customName: args.data.customName ?? null,
        notes: args.data.notes ?? null,
      };
      state.holdings.push(row);
      return row;
    },
    update: async (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => applyUpdate(state.holdings, args.where, args.data),
    delete: async (args: { where: { id: string } }) => {
      const index = state.holdings.findIndex((row) => row.id === args.where.id);
      if (index < 0) throw new Error("Missing holding");
      const [removed] = state.holdings.splice(index, 1);
      return removed;
    },
  },
  itemCharacter: {
    findMany: async (args: { where?: Record<string, unknown> }) =>
      state.items.filter((row) => matches(row, args.where)),
    findFirst: async (args: { where?: Record<string, unknown> }) =>
      state.items.find((row) => matches(row, args.where)) ?? null,
    findUnique: async (args: { where: { id: string } }) =>
      state.items.find((row) => row.id === args.where.id) ?? null,
    create: async (args: { data: Omit<Stack, "id"> & { id?: string } }) => {
      const row: Stack = {
        id: args.data.id ?? `ic-${nextId++}`,
        characterId: args.data.characterId,
        itemId: args.data.itemId,
        sourceType: args.data.sourceType,
        quantity: args.data.quantity,
        itemLocation: args.data.itemLocation,
        customName: args.data.customName ?? null,
        status: args.data.status,
        isEquipped: args.data.isEquipped,
        equipSlots: args.data.equipSlots ?? [],
        currentUses: args.data.currentUses ?? 0,
      };
      state.items.push(row);
      return row;
    },
    update: async (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => applyUpdate(state.items, args.where, args.data),
    delete: async (args: { where: { id: string } }) => {
      const index = state.items.findIndex((row) => row.id === args.where.id);
      if (index < 0) throw new Error("Missing item");
      const [removed] = state.items.splice(index, 1);
      return removed;
    },
  },
  botInstalledItem: {
    deleteMany: async (args: { where: { itemCharacterId: string } }) => {
      const before = state.links.length;
      state.links = state.links.filter(
        (link) => link.itemCharacterId !== args.where.itemCharacterId
      );
      return { count: before - state.links.length };
    },
    create: async (args: {
      data: { botCharacterId: string; itemCharacterId: string };
    }) => {
      const link = { id: `link-${nextId++}`, ...args.data };
      state.links.push(link);
      return link;
    },
  },
  vehicleMountedItem: {
    deleteMany: async () => ({ count: 0 }),
  },
  item: {
    findUnique: async (args: { where: { id: string } }) =>
      state.catalogue.get(args.where.id) ?? null,
  },
  customItem: {
    findUnique: async () => null,
  },
  uniqueItem: {
    findUnique: async (args: { where: { id: string } }) =>
      state.unique.get(args.where.id) ?? null,
  },
  bot: {
    findUnique: async (args: { where: { id: string } }) =>
      state.bots.get(args.where.id) ?? null,
    findMany: async (args?: { where?: { id?: { in: string[] } } }) => {
      const ids = args?.where?.id?.in;
      const rows = [...state.bots.values()];
      return ids ? rows.filter((row) => ids.includes(row.id)) : rows;
    },
  },
  customBot: {
    findUnique: async (args: { where: { id: string } }) =>
      state.customBots.get(args.where.id) ?? null,
    findMany: async (args?: { where?: { id?: { in: string[] } } }) => {
      const ids = args?.where?.id?.in;
      const rows = [...state.customBots.values()];
      return ids ? rows.filter((row) => ids.includes(row.id)) : rows;
    },
  },
  character: {
    findUnique: async (args: { where: { id: string } }) =>
      state.characters.has(args.where.id) ? { id: args.where.id } : null,
  },
  $transaction: async <T>(fn: (tx: typeof prisma) => Promise<T>) => fn(prisma),
};

vi.mock("@/app/lib/prisma/client", () => ({
  prisma,
}));

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  userHasPlayControl: (...args: unknown[]) => playControlMock(...args),
  characterIsInGame: (...args: unknown[]) => characterIsInGameMock(...args),
  charactersShareAnyGame: async () => true,
  viewerCanGiveItemToRecipient: async () => true,
}));

vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: async () => null,
  updateCharacter: async () => ({}),
}));

function resetStore() {
  nextId = 10;
  state.holdings = [
    {
      id: "hold-1",
      characterId: "char-1",
      botId: "bot-1",
      sourceType: "OFFICIAL",
      currentHp: 12,
      maxHpBonus: 0,
      customName: null,
      notes: null,
    },
  ];
  state.items = [];
  state.links = [];
  state.catalogue.clear();
  state.unique.clear();
  state.bots.clear();
  state.customBots.clear();
  state.characters = new Set(["char-1", "char-2"]);
  state.bots.set("bot-1", {
    id: "bot-1",
    accessType: "PLAYER",
    name: "Loader",
    imageKey: null,
    description: "A hauler frame.",
    confCost: 40,
    usage: null,
    notes: null,
    maxHp: 12,
    maxCargoWeightKg: null,
    maxInstalledItems: null,
    speed: 8,
    maxCarryWeight: 100,
    heightMetres: null,
    weight: null,
  });
  state.bots.set("bot-2", {
    id: "bot-2",
    accessType: "PLAYER",
    name: "Spare",
    imageKey: null,
    description: "A second frame.",
    confCost: 10,
    usage: null,
    notes: null,
    maxHp: 8,
    maxCargoWeightKg: null,
    maxInstalledItems: null,
    speed: 6,
    maxCarryWeight: 40,
  });
  state.customBots.set("cb-1", {
    id: "cb-1",
    gameId: "g-1",
    name: "Porter",
    description: null,
    confCost: null,
    usage: null,
    notes: null,
    maxHp: 9,
    membersCanModify: false,
    maxCargoWeightKg: null,
    maxInstalledItems: null,
    speed: 7,
    maxCarryWeight: 50,
  });
}

function addCatalogueItem(
  id: string,
  weight: number,
  botInstallable: boolean,
  extras?: {
    name?: string;
    equipSlotCost?: number | null;
    equipSlotTypes?: string[];
  }
) {
  state.catalogue.set(id, {
    id,
    name: extras?.name ?? id,
    weight,
    botInstallable,
    vehicleMountable: true,
    maxUses: null,
    modifiesAttribute: null,
    modifiesSkill: null,
    equipSlotCost: extras?.equipSlotCost,
    equipSlotTypes: extras?.equipSlotTypes,
  });
}

function addStack(args: {
  id: string;
  itemId: string;
  quantity?: number;
  itemLocation?: string | null;
  sourceType?: Stack["sourceType"];
  characterId?: string;
}) {
  state.items.push({
    id: args.id,
    characterId: args.characterId ?? "char-1",
    itemId: args.itemId,
    sourceType: args.sourceType ?? "GLOBAL_ITEM",
    quantity: args.quantity ?? 1,
    itemLocation: args.itemLocation ?? "carried",
    customName: null,
    status: "FUNCTIONAL",
    isEquipped: false,
    equipSlots: [],
    currentUses: 0,
  });
}

async function placeOnBot(
  itemCharacterId: string,
  placeName: "installed" | "cargo" | "carried"
) {
  const { POST } =
    await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
  return invokeRoute(
    POST,
    makeAuthedRequest({ itemCharacterId, place: placeName }, "user-1"),
    makeParams({ id: "char-1", botCharacterId: "hold-1" })
  );
}

async function equipOnBot(
  itemCharacterId: string,
  action: "equip" | "unequip",
  slot: "HAND" | "FOOT" | "BODY" | "HEAD" | "BRAIN"
) {
  const { POST } =
    await import("@/app/api/characters/[id]/bots/[botCharacterId]/equip/route");
  return invokeRoute(
    POST,
    makeAuthedRequest({ itemCharacterId, action, slot }, "user-1"),
    makeParams({ id: "char-1", botCharacterId: "hold-1" })
  );
}

function characterCarryKg(characterId: string): number {
  return getCarriedWeight(
    state.items
      .filter((row) => row.characterId === characterId)
      .map((row) => {
        const catalogue = state.catalogue.get(row.itemId);
        const unique = state.unique.get(row.itemId);
        const weight =
          unique?.weightOverride ??
          catalogue?.weight ??
          state.catalogue.get(unique?.itemId ?? "")?.weight ??
          0;
        return {
          itemLocation: row.itemLocation,
          quantity: row.quantity,
          equipSlots: row.equipSlots,
          item: { weight, name: catalogue?.name ?? "Item", equipSlotTypes: [] },
        };
      })
  );
}

describe("bot placements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    playControlMock.mockResolvedValue(true);
    characterIsInGameMock.mockResolvedValue(true);
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({ itemCharacterId: "ic-1", place: "cargo" }),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when the viewer does not control the character", async () => {
    playControlMock.mockResolvedValue(false);
    const { POST } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ itemCharacterId: "ic-1", place: "cargo" }, "user-1"),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(response.status).toBe(403);
  });

  it("installs, stows, and carries weight without counting it on the character", async () => {
    state.bots.get("bot-1")!.maxCargoWeightKg = 10;
    state.bots.get("bot-1")!.maxInstalledItems = 2;
    addCatalogueItem("servo", 5, true);
    addCatalogueItem("crate", 2, false);
    addCatalogueItem("tool", 1, false);
    addCatalogueItem("ration", 1, false);
    addStack({ id: "ic-servo", itemId: "servo" });
    addStack({ id: "ic-crate", itemId: "crate", quantity: 3 });
    addStack({ id: "ic-tool", itemId: "tool" });
    addStack({ id: "ic-ration", itemId: "ration" });

    const { POST } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
    const installed = await invokeRoute(
      POST,
      makeAuthedRequest(
        { itemCharacterId: "ic-servo", place: "installed" },
        "user-1"
      ),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    const cargo = await invokeRoute(
      POST,
      makeAuthedRequest(
        { itemCharacterId: "ic-crate", place: "cargo" },
        "user-1"
      ),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    const carried = await invokeRoute(
      POST,
      makeAuthedRequest(
        { itemCharacterId: "ic-tool", place: "carried" },
        "user-1"
      ),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );

    expect(installed.status).toBe(201);
    expect(cargo.status).toBe(201);
    expect(carried.status).toBe(201);
    const body = await carried.json();
    expect(body.installedCount).toBe(1);
    expect(body.installedItems).toEqual([
      expect.objectContaining({ itemCharacterId: "ic-servo", weightKg: 5 }),
    ]);
    expect(body.cargoWeightKg).toBe(6);
    expect(body.cargoItems).toEqual([
      expect.objectContaining({ itemCharacterId: "ic-crate", weightKg: 6 }),
    ]);
    expect(body.carriedWeightKg).toBe(1);
    expect(body.installedItems[0].weightKg + body.cargoWeightKg).toBe(11);
    expect(state.items.find((row) => row.id === "ic-servo")?.itemLocation).toBe(
      "bot-installed:hold-1"
    );
    expect(state.links).toEqual([
      expect.objectContaining({
        botCharacterId: "hold-1",
        itemCharacterId: "ic-servo",
      }),
    ]);
    expect(characterCarryKg("char-1")).toBe(1);
  });

  it("refuses to install an item that is not bot-installable", async () => {
    addCatalogueItem("crate", 2, false);
    addStack({ id: "ic-crate", itemId: "crate" });
    const { POST } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { itemCharacterId: "ic-crate", place: "installed" },
        "user-1"
      ),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        message: "This item cannot be installed on a bot",
      })
    );
    expect(state.items[0]?.itemLocation).toBe("carried");
    expect(state.links).toEqual([]);
  });

  it("refuses cargo past a set max and allows cargo when the max is unset", async () => {
    addCatalogueItem("crate", 2, false);
    addStack({ id: "ic-crate", itemId: "crate", quantity: 3 });
    state.bots.get("bot-1")!.maxCargoWeightKg = 5;
    const { POST } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
    const refused = await invokeRoute(
      POST,
      makeAuthedRequest(
        { itemCharacterId: "ic-crate", place: "cargo" },
        "user-1"
      ),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(refused.status).toBe(409);
    expect(await refused.json()).toEqual(
      expect.objectContaining({
        message: "Stowing this item would exceed cargo capacity (5 kg)",
      })
    );
    expect(state.items[0]?.itemLocation).toBe("carried");

    state.bots.get("bot-1")!.maxCargoWeightKg = null;
    const allowed = await invokeRoute(
      POST,
      makeAuthedRequest(
        { itemCharacterId: "ic-crate", place: "cargo" },
        "user-1"
      ),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(allowed.status).toBe(201);
    expect((await allowed.json()).cargoWeightKg).toBe(6);
  });

  it("refuses another install past a set max, including a max of 0", async () => {
    addCatalogueItem("servo", 1, true);
    addCatalogueItem("arm", 1, true);
    addStack({ id: "ic-servo", itemId: "servo" });
    addStack({ id: "ic-arm", itemId: "arm" });
    state.bots.get("bot-1")!.maxInstalledItems = 1;
    const { POST } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
    const first = await invokeRoute(
      POST,
      makeAuthedRequest(
        { itemCharacterId: "ic-servo", place: "installed" },
        "user-1"
      ),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(first.status).toBe(201);
    const second = await invokeRoute(
      POST,
      makeAuthedRequest(
        { itemCharacterId: "ic-arm", place: "installed" },
        "user-1"
      ),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(second.status).toBe(409);
    expect(await second.json()).toEqual(
      expect.objectContaining({
        message: "This bot can only install 1 item",
      })
    );

    state.bots.get("bot-1")!.maxInstalledItems = 0;
    state.items.find((row) => row.id === "ic-arm")!.itemLocation = "carried";
    const zeroCap = await invokeRoute(
      POST,
      makeAuthedRequest(
        { itemCharacterId: "ic-arm", place: "installed" },
        "user-1"
      ),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(zeroCap.status).toBe(409);
    expect((await zeroCap.json()).message).toBe(
      "This bot can only install 0 items"
    );
  });

  it("refuses an item that is already on a vehicle", async () => {
    addCatalogueItem("servo", 1, true);
    addStack({
      id: "ic-cargo",
      itemId: "servo",
      itemLocation: "vehicle:vc-1",
    });
    addStack({
      id: "ic-mounted",
      itemId: "servo",
      itemLocation: "vehicle-mounted:vc-1",
    });
    const { POST } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
    for (const itemCharacterId of ["ic-cargo", "ic-mounted"]) {
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ itemCharacterId, place: "cargo" }, "user-1"),
        makeParams({ id: "char-1", botCharacterId: "hold-1" })
      );
      expect(response.status).toBe(409);
      expect(await response.json()).toEqual(
        expect.objectContaining({
          message: "That item is already on a vehicle",
        })
      );
    }
    expect(state.links).toEqual([]);
  });

  it("refuses to remove a holding that still has rows, then removes it once they return", async () => {
    addCatalogueItem("crate", 2, false);
    addStack({ id: "ic-crate", itemId: "crate" });
    const { POST } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
    const { DELETE: returnItem } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/[itemCharacterId]/route");
    const { DELETE } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    expect(
      (
        await invokeRoute(
          POST,
          makeAuthedRequest(
            { itemCharacterId: "ic-crate", place: "cargo" },
            "user-1"
          ),
          makeParams({ id: "char-1", botCharacterId: "hold-1" })
        )
      ).status
    ).toBe(201);

    const blocked = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(blocked.status).toBe(409);
    expect(await blocked.json()).toEqual(
      expect.objectContaining({
        message:
          "Return placed items to carried inventory before removing this bot",
      })
    );
    expect(state.holdings.map((row) => row.id)).toEqual(["hold-1"]);

    const returned = await invokeRoute(
      returnItem,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({
        id: "char-1",
        botCharacterId: "hold-1",
        itemCharacterId: "ic-crate",
      })
    );
    expect(returned.status).toBe(200);
    expect(state.items[0]?.itemLocation).toBe("carried");

    const removed = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(removed.status).toBe(204);
    expect(state.holdings).toEqual([]);
  });

  it("refuses to move a holding that still has rows", async () => {
    addCatalogueItem("crate", 2, false);
    addStack({ id: "ic-crate", itemId: "crate" });
    const { POST: place } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
    const { POST: move } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/transfer/route");

    expect(
      (
        await invokeRoute(
          place,
          makeAuthedRequest(
            { itemCharacterId: "ic-crate", place: "cargo" },
            "user-1"
          ),
          makeParams({ id: "char-1", botCharacterId: "hold-1" })
        )
      ).status
    ).toBe(201);

    const blocked = await invokeRoute(
      move,
      makeAuthedRequest({ toCharacterId: "char-2" }, "user-1"),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(blocked.status).toBe(409);
    expect(await blocked.json()).toEqual(
      expect.objectContaining({
        message:
          "Return placed items to carried inventory before moving this bot",
      })
    );
    expect(state.holdings[0]?.characterId).toBe("char-1");
  });

  it("gives a new empty Official or Custom holding and leaves the first holding's items", async () => {
    addCatalogueItem("crate", 2, false);
    addStack({ id: "ic-crate", itemId: "crate" });
    const { POST: place } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
    const { POST: addBot, GET } =
      await import("@/app/api/characters/[id]/bots/route");

    expect(
      (
        await invokeRoute(
          place,
          makeAuthedRequest(
            { itemCharacterId: "ic-crate", place: "cargo" },
            "user-1"
          ),
          makeParams({ id: "char-1", botCharacterId: "hold-1" })
        )
      ).status
    ).toBe(201);

    const official = await invokeRoute(
      addBot,
      makeAuthedRequest({ botId: "bot-2" }, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(official.status).toBe(201);
    const officialBody = await official.json();
    expect(officialBody.installedCount).toBe(0);
    expect(officialBody.cargoItems).toEqual([]);
    expect(officialBody.carriedItems).toEqual([]);

    const custom = await invokeRoute(
      addBot,
      makeAuthedRequest(
        { botId: "cb-1", sourceType: "CUSTOM", gameId: "g-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(custom.status).toBe(201);

    const listed = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(listed.status).toBe(200);
    const holdings = await listed.json();
    const first = holdings.find(
      (holding: { id: string }) => holding.id === "hold-1"
    );
    const extras = holdings.filter(
      (holding: { id: string }) => holding.id !== "hold-1"
    );
    expect(first.cargoItems).toEqual([
      expect.objectContaining({ itemCharacterId: "ic-crate" }),
    ]);
    expect(extras).toHaveLength(2);
    expect(
      extras.every(
        (holding: { cargoItems: unknown[]; installedItems: unknown[] }) =>
          holding.cargoItems.length === 0 && holding.installedItems.length === 0
      )
    ).toBe(true);
    expect(state.items.filter((row) => row.itemId === "crate")).toHaveLength(1);
  });

  it("lets a unique override install when the template cannot, and refuse when the override says no", async () => {
    addCatalogueItem("servo", 1, false);
    state.unique.set("uniq-yes", {
      id: "uniq-yes",
      sourceType: "GLOBAL_ITEM",
      itemId: "servo",
      gameId: null,
      nameOverride: "Servo rig",
      weightOverride: null,
      botInstallableOverride: true,
      vehicleMountableOverride: null,
      maxUsesOverride: null,
    });
    addCatalogueItem("arm", 1, true);
    state.unique.set("uniq-no", {
      id: "uniq-no",
      sourceType: "GLOBAL_ITEM",
      itemId: "arm",
      gameId: null,
      nameOverride: "Locked arm",
      weightOverride: null,
      botInstallableOverride: false,
      vehicleMountableOverride: null,
      maxUsesOverride: null,
    });
    addStack({
      id: "ic-yes",
      itemId: "uniq-yes",
      sourceType: "UNIQUE_ITEM",
    });
    addStack({
      id: "ic-no",
      itemId: "uniq-no",
      sourceType: "UNIQUE_ITEM",
    });
    const { POST } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
    const installed = await invokeRoute(
      POST,
      makeAuthedRequest(
        { itemCharacterId: "ic-yes", place: "installed" },
        "user-1"
      ),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(installed.status).toBe(201);
    const refused = await invokeRoute(
      POST,
      makeAuthedRequest(
        { itemCharacterId: "ic-no", place: "installed" },
        "user-1"
      ),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(refused.status).toBe(409);
    expect((await refused.json()).message).toBe(
      "This item cannot be installed on a bot"
    );
  });

  it("leaves the remainder in place on a partial transfer and clears the link when the stack is given away", async () => {
    addCatalogueItem("servo", 1, true);
    addStack({ id: "ic-servo", itemId: "servo", quantity: 2 });
    const { POST: place } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
    const { POST: transfer } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/transfer/route");

    expect(
      (
        await invokeRoute(
          place,
          makeAuthedRequest(
            { itemCharacterId: "ic-servo", place: "installed" },
            "user-1"
          ),
          makeParams({ id: "char-1", botCharacterId: "hold-1" })
        )
      ).status
    ).toBe(201);

    const partial = await invokeRoute(
      transfer,
      makeAuthedRequest({ toCharacterId: "char-2", quantity: 1 }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-servo" })
    );
    expect(partial.status).toBe(200);
    const giver = state.items.find((row) => row.id === "ic-servo");
    const recipient = state.items.find((row) => row.characterId === "char-2");
    expect(giver).toEqual(
      expect.objectContaining({
        quantity: 1,
        itemLocation: "bot-installed:hold-1",
      })
    );
    expect(recipient).toEqual(
      expect.objectContaining({
        quantity: 1,
        itemLocation: "carried",
      })
    );
    expect(state.links).toEqual([
      expect.objectContaining({ itemCharacterId: "ic-servo" }),
    ]);

    const rest = await invokeRoute(
      transfer,
      makeAuthedRequest({ toCharacterId: "char-2", quantity: 1 }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-servo" })
    );
    expect(rest.status).toBe(200);
    expect(state.items.find((row) => row.id === "ic-servo")).toBeUndefined();
    expect(state.links).toEqual([]);
    expect(
      state.items.find((row) => row.characterId === "char-2")?.itemLocation
    ).toBe("carried");
  });

  it("returns 400 for a bad placement body and 404 when the item is missing", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
    const badBody = await invokeRoute(
      POST,
      makeAuthedRequest({ itemCharacterId: "ic-missing" }, "user-1"),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(badBody.status).toBe(400);

    const missing = await invokeRoute(
      POST,
      makeAuthedRequest(
        { itemCharacterId: "ic-missing", place: "cargo" },
        "user-1"
      ),
      makeParams({ id: "char-1", botCharacterId: "hold-1" })
    );
    expect(missing.status).toBe(404);
    expect((await missing.json()).message).toBe(
      "Item not found in this character's inventory"
    );
  });

  it("refuses a bigger cargo stack past a set max and allows it when the max is unset", async () => {
    addCatalogueItem("crate", 2, false);
    addStack({
      id: "ic-crate",
      itemId: "crate",
      quantity: 2,
      itemLocation: "bot-cargo:hold-1",
    });
    state.bots.get("bot-1")!.maxCargoWeightKg = 5;
    const { PATCH } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");

    const refused = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setQuantity", quantity: 3 }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-crate" })
    );
    expect(refused.status).toBe(409);
    expect((await refused.json()).message).toBe(
      "Stowing this item would exceed cargo capacity (5 kg)"
    );
    expect(state.items[0]?.quantity).toBe(2);

    state.bots.get("bot-1")!.maxCargoWeightKg = null;
    const allowed = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setQuantity", quantity: 3 }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-crate" })
    );
    expect(allowed.status).toBe(200);
    expect(state.items[0]?.quantity).toBe(3);
  });

  it("moves an empty holding and refuses the transfer when the request is not allowed", async () => {
    const { POST: move } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/transfer/route");
    const params = makeParams({ id: "char-1", botCharacterId: "hold-1" });

    expect(
      (
        await invokeRoute(
          move,
          makeUnauthedRequest({ toCharacterId: "char-2" }),
          params
        )
      ).status
    ).toBe(401);

    playControlMock.mockResolvedValueOnce(false);
    expect(
      (
        await invokeRoute(
          move,
          makeAuthedRequest({ toCharacterId: "char-2" }, "user-1"),
          params
        )
      ).status
    ).toBe(403);

    const sameCharacter = await invokeRoute(
      move,
      makeAuthedRequest({ toCharacterId: "char-1" }, "user-1"),
      params
    );
    expect(sameCharacter.status).toBe(400);
    expect((await sameCharacter.json()).message).toBe(
      "Cannot give a bot to the same character"
    );

    const missing = await invokeRoute(
      move,
      makeAuthedRequest({ toCharacterId: "char-2" }, "user-1"),
      makeParams({ id: "char-1", botCharacterId: "missing" })
    );
    expect(missing.status).toBe(404);

    const badBody = await invokeRoute(
      move,
      makeAuthedRequest({}, "user-1"),
      params
    );
    expect(badBody.status).toBe(400);

    state.holdings.push({
      id: "hold-custom",
      characterId: "char-1",
      botId: "cb-1",
      sourceType: "CUSTOM",
      currentHp: 9,
      maxHpBonus: 0,
      customName: null,
      notes: null,
    });
    characterIsInGameMock.mockResolvedValue(false);
    const wrongGame = await invokeRoute(
      move,
      makeAuthedRequest({ toCharacterId: "char-2" }, "user-1"),
      makeParams({ id: "char-1", botCharacterId: "hold-custom" })
    );
    expect(wrongGame.status).toBe(403);
    expect((await wrongGame.json()).message).toBe(
      "That bot can only be given to another character in the same custom-bot game"
    );
    expect(
      state.holdings.find((row) => row.id === "hold-custom")?.characterId
    ).toBe("char-1");

    characterIsInGameMock.mockResolvedValue(true);
    const moved = await invokeRoute(
      move,
      makeAuthedRequest({ toCharacterId: "char-2" }, "user-1"),
      params
    );
    expect(moved.status).toBe(200);
    expect(await moved.json()).toEqual({ message: "Bot transferred" });
    expect(state.holdings.find((row) => row.id === "hold-1")?.characterId).toBe(
      "char-2"
    );
  });

  it("returns a placed row to carried, and refuses when the caller or the row is wrong", async () => {
    addCatalogueItem("crate", 2, false);
    addStack({
      id: "ic-crate",
      itemId: "crate",
      itemLocation: "bot-cargo:hold-1",
    });
    const { DELETE } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/[itemCharacterId]/route");
    const params = makeParams({
      id: "char-1",
      botCharacterId: "hold-1",
      itemCharacterId: "ic-crate",
    });

    expect(
      (await invokeRoute(DELETE, makeUnauthedRequest(), params)).status
    ).toBe(401);

    playControlMock.mockResolvedValueOnce(false);
    expect(
      (
        await invokeRoute(
          DELETE,
          makeAuthedRequest(undefined, "user-1"),
          params
        )
      ).status
    ).toBe(403);

    const missing = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({
        id: "char-1",
        botCharacterId: "hold-1",
        itemCharacterId: "missing",
      })
    );
    expect(missing.status).toBe(404);
    expect(state.items[0]?.itemLocation).toBe("bot-cargo:hold-1");

    const returned = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      params
    );
    expect(returned.status).toBe(200);
    expect(state.items[0]?.itemLocation).toBe("carried");
    expect((await returned.json()).cargoItems).toEqual([]);
  });

  it("delivers a gift carried when the recipient already has that item placed", async () => {
    addCatalogueItem("servo", 1, true);
    addStack({ id: "ic-giver", itemId: "servo", quantity: 2 });
    state.holdings.push({
      id: "hold-2",
      characterId: "char-2",
      botId: "bot-2",
      sourceType: "OFFICIAL",
      currentHp: 8,
      maxHpBonus: 0,
      customName: null,
      notes: null,
    });
    addStack({
      id: "ic-recipient",
      itemId: "servo",
      characterId: "char-2",
      itemLocation: "bot-installed:hold-2",
    });
    state.links.push({
      id: "link-recipient",
      botCharacterId: "hold-2",
      itemCharacterId: "ic-recipient",
    });
    const { POST: place } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/placements/route");
    const { POST: transfer } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/transfer/route");

    expect(
      (
        await invokeRoute(
          place,
          makeAuthedRequest(
            { itemCharacterId: "ic-giver", place: "installed" },
            "user-1"
          ),
          makeParams({ id: "char-1", botCharacterId: "hold-1" })
        )
      ).status
    ).toBe(201);

    const partial = await invokeRoute(
      transfer,
      makeAuthedRequest({ toCharacterId: "char-2", quantity: 1 }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-giver" })
    );
    expect(partial.status).toBe(200);
    expect(state.items.find((row) => row.id === "ic-giver")).toEqual(
      expect.objectContaining({
        quantity: 1,
        itemLocation: "bot-installed:hold-1",
      })
    );
    expect(state.items.find((row) => row.id === "ic-recipient")).toEqual(
      expect.objectContaining({
        quantity: 2,
        itemLocation: "carried",
      })
    );
    expect(state.links).toEqual([
      expect.objectContaining({ itemCharacterId: "ic-giver" }),
    ]);
  });

  it("leaves speed unchanged at or under half load and ignores the bot's own weight", async () => {
    const bot = state.bots.get("bot-1")!;
    bot.speed = 10;
    bot.maxCarryWeight = 10;
    bot.weight = 400;
    bot.heightMetres = 1.8;
    addCatalogueItem("light", 5, false);
    addStack({ id: "ic-light", itemId: "light" });

    const response = await placeOnBot("ic-light", "carried");
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.effectiveSpeed).toBe(10);
    expect(body.speedStrikethrough).toBe(false);
    expect(body.weight).toBe(400);
    expect(body.heightMetres).toBe(1.8);
    expect(body.carriedWeightKg).toBe(5);
    expect(characterCarryKg("char-1")).toBe(0);
  });

  it("reduces speed by 1 through 75% and by 2 through 100%", async () => {
    const bot = state.bots.get("bot-1")!;
    bot.speed = 10;
    bot.maxCarryWeight = 10;
    addCatalogueItem("mid", 6, false);
    addCatalogueItem("near", 8, false);
    addStack({ id: "ic-mid", itemId: "mid" });
    addStack({ id: "ic-near", itemId: "near" });

    const through75 = await placeOnBot("ic-mid", "carried");
    expect(through75.status).toBe(201);
    const midBody = await through75.json();
    expect(midBody.effectiveSpeed).toBe(9);
    expect(midBody.speedStrikethrough).toBe(true);

    state.items.find((row) => row.id === "ic-mid")!.itemLocation = "carried";
    const through100 = await placeOnBot("ic-near", "carried");
    expect(through100.status).toBe(201);
    expect((await through100.json()).effectiveSpeed).toBe(8);
  });

  it("halves speed through 150% and floors an odd base, and cargo does not change speed", async () => {
    const bot = state.bots.get("bot-1")!;
    bot.speed = 11;
    bot.maxCarryWeight = 10;
    addCatalogueItem("load", 15, false);
    addCatalogueItem("crate", 20, false);
    addStack({ id: "ic-load", itemId: "load" });
    addStack({ id: "ic-crate", itemId: "crate" });

    const loaded = await placeOnBot("ic-load", "carried");
    expect(loaded.status).toBe(201);
    const loadedBody = await loaded.json();
    expect(loadedBody.effectiveSpeed).toBe(5);
    expect(loadedBody.speedStrikethrough).toBe(true);

    const cargo = await placeOnBot("ic-crate", "cargo");
    expect(cargo.status).toBe(201);
    const cargoBody = await cargo.json();
    expect(cargoBody.cargoWeightKg).toBe(20);
    expect(cargoBody.effectiveSpeed).toBe(5);
  });

  it("does not reduce speed below 0", async () => {
    const bot = state.bots.get("bot-1")!;
    bot.speed = 1;
    bot.maxCarryWeight = 10;
    addCatalogueItem("mid", 6, false);
    addStack({ id: "ic-mid", itemId: "mid" });

    const response = await placeOnBot("ic-mid", "carried");
    expect(response.status).toBe(201);
    expect((await response.json()).effectiveSpeed).toBe(0);
  });

  it("refuses carried weight that would pass 150% of max carry", async () => {
    const bot = state.bots.get("bot-1")!;
    bot.speed = 10;
    bot.maxCarryWeight = 10;
    addCatalogueItem("limit", 16, false);
    addStack({ id: "ic-limit", itemId: "limit" });

    const response = await placeOnBot("ic-limit", "carried");
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        message: "Carried load would pass 150% of max carry",
      })
    );
    expect(state.items[0]?.itemLocation).toBe("carried");
  });

  it("raises effective max carry when a backpack is equipped on Body", async () => {
    const bot = state.bots.get("bot-1")!;
    bot.speed = 10;
    bot.maxCarryWeight = 10;
    addCatalogueItem("pack", 1, false, {
      name: "Backpack (small)",
      equipSlotTypes: ["BODY"],
    });
    addCatalogueItem("load", 15, false);
    addStack({ id: "ic-pack", itemId: "pack" });
    addStack({ id: "ic-load", itemId: "load" });

    expect((await placeOnBot("ic-pack", "carried")).status).toBe(201);
    const equipped = await equipOnBot("ic-pack", "equip", "BODY");
    expect(equipped.status).toBe(200);
    expect((await equipped.json()).effectiveMaxCarryWeight).toBe(11);

    const loaded = await placeOnBot("ic-load", "carried");
    expect(loaded.status).toBe(201);
    const body = await loaded.json();
    expect(body.carriedWeightKg).toBe(16);
    expect(body.effectiveMaxCarryWeight).toBe(11);
    expect(body.maxCarryWeight).toBe(10);
    expect(body.effectiveSpeed).toBe(5);
  });

  it("equips carried items in the hands up to cost 2 and keeps character slots empty", async () => {
    const bot = state.bots.get("bot-1")!;
    bot.maxCarryWeight = 100;
    addCatalogueItem("rifle", 1, false, {
      equipSlotCost: 2,
      equipSlotTypes: ["HAND"],
    });
    addCatalogueItem("knife", 1, false, { equipSlotTypes: ["HAND"] });
    addCatalogueItem("token", 0, false, {
      equipSlotCost: 0,
      equipSlotTypes: ["HAND"],
    });
    addStack({ id: "ic-rifle", itemId: "rifle" });
    addStack({ id: "ic-knife", itemId: "knife" });
    addStack({ id: "ic-token", itemId: "token" });

    expect((await placeOnBot("ic-rifle", "carried")).status).toBe(201);
    expect((await placeOnBot("ic-knife", "carried")).status).toBe(201);
    expect((await placeOnBot("ic-token", "carried")).status).toBe(201);

    const rifle = await equipOnBot("ic-rifle", "equip", "HAND");
    expect(rifle.status).toBe(200);
    expect(state.items.find((row) => row.id === "ic-rifle")).toEqual(
      expect.objectContaining({
        botEquipSlots: ["HAND"],
        equipSlots: [],
        isEquipped: false,
      })
    );

    const knife = await equipOnBot("ic-knife", "equip", "HAND");
    expect(knife.status).toBe(409);
    expect(await knife.json()).toEqual(
      expect.objectContaining({
        message: "The bot's hands cannot fit that item",
      })
    );

    const token = await equipOnBot("ic-token", "equip", "HAND");
    expect(token.status).toBe(200);
    expect(
      state.items.find((row) => row.id === "ic-token")?.botEquipSlots
    ).toEqual(["HAND"]);
  });

  it("treats a missing hand cost as 1", async () => {
    const bot = state.bots.get("bot-1")!;
    bot.maxCarryWeight = 100;
    addCatalogueItem("knife", 1, false, { equipSlotTypes: ["HAND"] });
    addCatalogueItem("dagger", 1, false, { equipSlotTypes: ["HAND"] });
    addCatalogueItem("shiv", 1, false, { equipSlotTypes: ["HAND"] });
    addStack({ id: "ic-knife", itemId: "knife" });
    addStack({ id: "ic-dagger", itemId: "dagger" });
    addStack({ id: "ic-shiv", itemId: "shiv" });
    expect((await placeOnBot("ic-knife", "carried")).status).toBe(201);
    expect((await placeOnBot("ic-dagger", "carried")).status).toBe(201);
    expect((await placeOnBot("ic-shiv", "carried")).status).toBe(201);

    expect((await equipOnBot("ic-knife", "equip", "HAND")).status).toBe(200);
    expect((await equipOnBot("ic-dagger", "equip", "HAND")).status).toBe(200);
    const shiv = await equipOnBot("ic-shiv", "equip", "HAND");
    expect(shiv.status).toBe(409);
    expect(await shiv.json()).toEqual(
      expect.objectContaining({
        message: "The bot's hands cannot fit that item",
      })
    );
  });

  it("refuses a second item on Body", async () => {
    const bot = state.bots.get("bot-1")!;
    bot.maxCarryWeight = 100;
    addCatalogueItem("coat", 1, false, { equipSlotTypes: ["BODY"] });
    addCatalogueItem("vest", 1, false, { equipSlotTypes: ["BODY"] });
    addStack({ id: "ic-coat", itemId: "coat" });
    addStack({ id: "ic-vest", itemId: "vest" });
    expect((await placeOnBot("ic-coat", "carried")).status).toBe(201);
    expect((await placeOnBot("ic-vest", "carried")).status).toBe(201);
    expect((await equipOnBot("ic-coat", "equip", "BODY")).status).toBe(200);
    const vest = await equipOnBot("ic-vest", "equip", "BODY");
    expect(vest.status).toBe(409);
    expect(await vest.json()).toEqual(
      expect.objectContaining({
        message: "The bot's Body slot cannot fit another item",
      })
    );
  });

  it("refuses equipping Foot, Head, or Brain", async () => {
    const bot = state.bots.get("bot-1")!;
    bot.maxCarryWeight = 100;
    addCatalogueItem("boot", 1, false, {
      equipSlotTypes: ["FOOT", "HEAD", "BRAIN"],
    });
    addStack({ id: "ic-boot", itemId: "boot" });
    expect((await placeOnBot("ic-boot", "carried")).status).toBe(201);

    for (const slot of ["FOOT", "HEAD", "BRAIN"] as const) {
      const response = await equipOnBot("ic-boot", "equip", slot);
      expect(response.status).toBe(409);
      expect(await response.json()).toEqual(
        expect.objectContaining({
          message: "Bots cannot equip Foot, Head, or Brain",
        })
      );
    }
    expect(state.items[0]?.botEquipSlots ?? []).toEqual([]);
  });

  it("refuses equipping an item that is not bot-carried", async () => {
    const bot = state.bots.get("bot-1")!;
    bot.maxCarryWeight = 100;
    addCatalogueItem("knife", 1, false, { equipSlotTypes: ["HAND"] });
    addStack({ id: "ic-knife", itemId: "knife" });

    const carriedByCharacter = await equipOnBot("ic-knife", "equip", "HAND");
    expect(carriedByCharacter.status).toBe(409);
    expect(await carriedByCharacter.json()).toEqual(
      expect.objectContaining({
        message: "Only items this bot is carrying can be equipped",
      })
    );

    expect((await placeOnBot("ic-knife", "cargo")).status).toBe(201);
    const inCargo = await equipOnBot("ic-knife", "equip", "HAND");
    expect(inCargo.status).toBe(409);
    expect(await inCargo.json()).toEqual(
      expect.objectContaining({
        message: "Only items this bot is carrying can be equipped",
      })
    );
  });

  it("clears bot equip when a row is installed or put in cargo", async () => {
    const bot = state.bots.get("bot-1")!;
    bot.maxCarryWeight = 100;
    bot.maxInstalledItems = 2;
    addCatalogueItem("rifle", 1, true, { equipSlotTypes: ["HAND"] });
    addCatalogueItem("coat", 1, false, { equipSlotTypes: ["BODY"] });
    addStack({ id: "ic-rifle", itemId: "rifle" });
    addStack({ id: "ic-coat", itemId: "coat" });
    expect((await placeOnBot("ic-rifle", "carried")).status).toBe(201);
    expect((await placeOnBot("ic-coat", "carried")).status).toBe(201);
    expect((await equipOnBot("ic-rifle", "equip", "HAND")).status).toBe(200);
    expect((await equipOnBot("ic-coat", "equip", "BODY")).status).toBe(200);

    expect((await placeOnBot("ic-rifle", "installed")).status).toBe(201);
    expect(
      state.items.find((row) => row.id === "ic-rifle")?.botEquipSlots
    ).toEqual([]);
    expect((await placeOnBot("ic-coat", "cargo")).status).toBe(201);
    expect(
      state.items.find((row) => row.id === "ic-coat")?.botEquipSlots
    ).toEqual([]);
  });
});
