import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();
const userIsSuperAdminMock = vi.fn();
const getCustomItemMock = vi.fn();
const getUniqueItemMock = vi.fn();
const getItemsMock = vi.fn();
const createItemMock = vi.fn();
const deleteCustomItemMock = vi.fn();
const updateCustomItemMock = vi.fn();
const getCustomVehicleMock = vi.fn();
const getUniqueVehicleMock = vi.fn();
const getVehiclesMock = vi.fn();
const createVehicleMock = vi.fn();
const deleteCustomVehicleMock = vi.fn();
const getCustomEnemyMock = vi.fn();
const getEnemyInstanceMock = vi.fn();
const getEnemiesMock = vi.fn();
const createEnemyMock = vi.fn();
const deleteCustomEnemyMock = vi.fn();
const touchStaffCatalogueDriftMock = vi.fn();
const envR2SendMock = vi.fn();
const catalogueR2SendMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/customItem", () => ({
  getCustomItem: getCustomItemMock,
  deleteCustomItem: deleteCustomItemMock,
  updateCustomItem: updateCustomItemMock,
}));

vi.mock("@/app/lib/prisma/uniqueItem", () => ({
  getUniqueItem: getUniqueItemMock,
}));

vi.mock("@/app/lib/prisma/item", () => ({
  getItems: getItemsMock,
  createItem: createItemMock,
}));

vi.mock("@/app/lib/prisma/vehicle", () => ({
  getCustomVehicle: getCustomVehicleMock,
  getVehicles: getVehiclesMock,
  createVehicle: createVehicleMock,
  deleteCustomVehicle: deleteCustomVehicleMock,
}));

vi.mock("@/app/lib/prisma/uniqueVehicle", () => ({
  getUniqueVehicle: getUniqueVehicleMock,
}));

vi.mock("@/app/lib/prisma/customEnemy", () => ({
  getCustomEnemy: getCustomEnemyMock,
  deleteCustomEnemy: deleteCustomEnemyMock,
}));

vi.mock("@/app/lib/prisma/enemyInstance", () => ({
  getEnemyInstance: getEnemyInstanceMock,
}));

vi.mock("@/app/lib/prisma/enemy", () => ({
  getEnemies: getEnemiesMock,
  createEnemy: createEnemyMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: touchStaffCatalogueDriftMock,
}));

vi.mock("@/app/lib/r2", () => ({
  getR2ConfigForKey: () => ({
    bucketName: "env-bucket",
    s3Client: { send: envR2SendMock },
  }),
  getCatalogueR2Config: () => ({
    bucketName: "neblir-catalogue",
    s3Client: { send: catalogueR2SendMock },
  }),
}));

const promoteBody = {
  catalogueDomain: "items",
  customId: "custom-1",
  accessType: "PLAYER",
};

function incompleteCustomItem() {
  return {
    id: "custom-1",
    gameId: "g-1",
    name: "Playtest Blade",
    type: "GENERAL_ITEM" as const,
    weight: 1,
    confCost: null as number | null,
    description: null as string | null,
    usage: null as string | null,
    imageKey: null as string | null,
    notes: null as string | null,
    costInfo: null as string | null,
    attackRoll: [] as string[],
  };
}

function completeCustomItem() {
  return {
    ...incompleteCustomItem(),
    confCost: 12,
    description: "A tested blade.",
    usage: "Melee weapon",
  };
}

describe("POST /api/games/[id]/catalogue-promotions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    getCustomItemMock.mockResolvedValue(null);
    getUniqueItemMock.mockResolvedValue(null);
    getItemsMock.mockResolvedValue([]);
    getCustomVehicleMock.mockResolvedValue(null);
    getUniqueVehicleMock.mockResolvedValue(null);
    getVehiclesMock.mockResolvedValue([]);
    getCustomEnemyMock.mockResolvedValue(null);
    getEnemyInstanceMock.mockResolvedValue(null);
    getEnemiesMock.mockResolvedValue([]);
    touchStaffCatalogueDriftMock.mockResolvedValue(undefined);
    envR2SendMock.mockReset();
    catalogueR2SendMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest(promoteBody),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when the caller is not Super Admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(promoteBody, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 403 when Super Admin is not this game's GM", async () => {
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(promoteBody, "other-super-admin"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 404 when the game does not exist", async () => {
    getGameMock.mockResolvedValue(null);
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(promoteBody, "gm-1"),
      makeParams({ id: "missing-game" })
    );
    expect(response.status).toBe(404);
    expect(createItemMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the Custom item is not in this game", async () => {
    getCustomItemMock.mockResolvedValue(null);
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(promoteBody, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
    expect(createItemMock).not.toHaveBeenCalled();
  });

  it("returns 400 when item promotion omits accessType", async () => {
    getCustomItemMock.mockResolvedValue(completeCustomItem());
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { catalogueDomain: "items", customId: "custom-1" },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(createItemMock).not.toHaveBeenCalled();
  });

  it("returns 400 when Official requireds are still missing", async () => {
    getCustomItemMock.mockResolvedValue(incompleteCustomItem());
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(promoteBody, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(createItemMock).not.toHaveBeenCalled();
  });

  it("returns 400 when a Custom weapon lacks Official damage", async () => {
    getCustomItemMock.mockResolvedValue({
      ...completeCustomItem(),
      type: "WEAPON",
      attackRoll: ["MELEE"],
      damage: null,
    });
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(promoteBody, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(createItemMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the short form sends a blank Official description", async () => {
    getCustomItemMock.mockResolvedValue(incompleteCustomItem());
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          catalogueDomain: "items",
          customId: "custom-1",
          accessType: "PLAYER",
          confCost: 5,
          description: "   ",
          usage: "Use it",
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(createItemMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the id is a Unique item", async () => {
    getUniqueItemMock.mockResolvedValue({ id: "unique-1" });
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          catalogueDomain: "items",
          customId: "unique-1",
          accessType: "PLAYER",
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(createItemMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the Custom vehicle is not in this game", async () => {
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          catalogueDomain: "vehicles",
          customId: "cv-missing",
          accessType: "PLAYER",
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
    expect(createVehicleMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the id is a Unique vehicle", async () => {
    getUniqueVehicleMock.mockResolvedValue({ id: "unique-v-1" });
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          catalogueDomain: "vehicles",
          customId: "unique-v-1",
          accessType: "PLAYER",
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(createVehicleMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the Custom enemy is not in this game", async () => {
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { catalogueDomain: "enemies", customId: "ce-missing" },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
    expect(createEnemyMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the id is an Enemy instance", async () => {
    getEnemyInstanceMock.mockResolvedValue({ id: "inst-1" });
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { catalogueDomain: "enemies", customId: "inst-1" },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(createEnemyMock).not.toHaveBeenCalled();
  });

  it("returns 409 when the Official name is already taken", async () => {
    getCustomItemMock.mockResolvedValue(completeCustomItem());
    getItemsMock.mockResolvedValue([
      { id: "official-1", name: "playtest  blade" },
    ]);
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(promoteBody, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(409);
    expect(createItemMock).not.toHaveBeenCalled();
  });

  it("returns 201, copies art, touches drift, and leaves the Custom item in place", async () => {
    getCustomItemMock.mockResolvedValue({
      ...completeCustomItem(),
      imageKey: "custom_items-blade-abc.png",
    });
    envR2SendMock.mockResolvedValue({
      Body: {
        transformToByteArray: async () => new Uint8Array([9, 8, 7]),
      },
      ContentType: "image/png",
    });
    catalogueR2SendMock.mockResolvedValue({});
    createItemMock.mockResolvedValue({
      id: "official-new",
      name: "Playtest Blade",
    });
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(promoteBody, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.catalogueDomain).toBe("items");
    expect(json.official.id).toBe("official-new");
    expect(json.official.id).not.toBe("custom-1");
    expect(createItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Playtest Blade",
        accessType: "PLAYER",
        confCost: 12,
        description: "A tested blade.",
        imageKey: expect.stringMatching(/^items-/),
      }),
      { officialCatalogueWrite: true }
    );
    const createdImageKey = createItemMock.mock.calls[0]?.[0]
      ?.imageKey as string;
    expect(createdImageKey).not.toMatch(/^custom_items-/);
    expect(catalogueR2SendMock).toHaveBeenCalled();
    expect(touchStaffCatalogueDriftMock).toHaveBeenCalledWith(["items"]);
    expect(deleteCustomItemMock).not.toHaveBeenCalled();
    expect(updateCustomItemMock).not.toHaveBeenCalled();
  });

  it("returns 201 with no imageKey when the Custom item has no art", async () => {
    getCustomItemMock.mockResolvedValue(completeCustomItem());
    createItemMock.mockResolvedValue({
      id: "official-new",
      name: "Playtest Blade",
      imageKey: null,
    });
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          catalogueDomain: "items",
          customId: "custom-1",
          accessType: "GAME_MASTER",
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(createItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        accessType: "GAME_MASTER",
        confCost: 12,
        description: "A tested blade.",
      }),
      { officialCatalogueWrite: true }
    );
    const created = createItemMock.mock.calls[0]?.[0] as { imageKey?: unknown };
    expect(created.imageKey == null || created.imageKey === undefined).toBe(
      true
    );
    expect(envR2SendMock).not.toHaveBeenCalled();
    expect(catalogueR2SendMock).not.toHaveBeenCalled();
    expect(deleteCustomItemMock).not.toHaveBeenCalled();
  });

  it("returns 201 when the short form supplies missing weapon damage", async () => {
    getCustomItemMock.mockResolvedValue({
      ...completeCustomItem(),
      type: "WEAPON",
      attackRoll: ["MELEE"],
      damage: null,
    });
    createItemMock.mockResolvedValue({
      id: "official-weapon",
      name: "Playtest Blade",
    });
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          catalogueDomain: "items",
          customId: "custom-1",
          accessType: "PLAYER",
          damage: {
            damageType: ["BLADE"],
            diceType: 6,
            numberOfDice: 1,
          },
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(createItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "WEAPON",
        damage: expect.objectContaining({
          damageType: ["BLADE"],
          diceType: 6,
          numberOfDice: 1,
        }),
      }),
      { officialCatalogueWrite: true }
    );
  });

  it("creates no Official row when image copy fails", async () => {
    getCustomItemMock.mockResolvedValue({
      ...completeCustomItem(),
      imageKey: "custom_items-blade-abc.png",
    });
    envR2SendMock.mockRejectedValue(new Error("get object failed"));
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(promoteBody, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(createItemMock).not.toHaveBeenCalled();
    expect(deleteCustomItemMock).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDriftMock).not.toHaveBeenCalled();
  });

  it("returns 201 for a Custom vehicle without copying membersCanModify", async () => {
    getCustomVehicleMock.mockResolvedValue({
      id: "cv-1",
      gameId: "g-1",
      name: "Dust Runner",
      confCost: 100,
      description: "Fast.",
      maxHp: 10,
      travelSpeedKmh: 80,
      combatSpeedMetres: 12,
      manoeuvrability: 2,
      acceleration: 3,
      maxPassengers: 2,
      locomotionModes: ["LAND"],
      vehicleSizeCategory: "STANDARD",
      membersCanModify: true,
      imageKey: null,
    });
    createVehicleMock.mockResolvedValue({
      id: "official-vehicle",
      name: "Dust Runner",
    });
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          catalogueDomain: "vehicles",
          customId: "cv-1",
          accessType: "PLAYER",
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(createVehicleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Dust Runner",
        accessType: "PLAYER",
        confCost: 100,
      }),
      { officialCatalogueWrite: true }
    );
    const created = createVehicleMock.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(created.membersCanModify).toBeUndefined();
    expect(deleteCustomVehicleMock).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDriftMock).toHaveBeenCalledWith(["vehicles"]);
  });

  it("returns 201 for a Custom enemy and leaves instances on the Custom template", async () => {
    getCustomEnemyMock.mockResolvedValue({
      id: "ce-1",
      gameId: "g-1",
      name: "Playtest Goblin",
      health: 8,
      speed: 5,
      initiativeModifier: 1,
      numberOfReactions: 1,
      defenceMelee: 0,
      defenceRange: 0,
      defenceGrid: 0,
      attackMelee: 0,
      attackRange: 0,
      attackThrow: 0,
      attackGrid: 0,
      immunities: [],
      resistances: [],
      vulnerabilities: [],
      actions: [],
      additionalActions: [],
    });
    createEnemyMock.mockResolvedValue({
      id: "official-enemy",
      name: "Playtest Goblin",
    });
    const { POST } =
      await import("@/app/api/games/[id]/catalogue-promotions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { catalogueDomain: "enemies", customId: "ce-1" },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(createEnemyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Playtest Goblin",
        health: 8,
        protectedFromOfficialImport: true,
      })
    );
    expect(deleteCustomEnemyMock).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDriftMock).toHaveBeenCalledWith(["enemies"]);
  });
});
