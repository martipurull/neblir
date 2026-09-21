import { ItemAttributePath, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/app/lib/prisma/client";
import {
  acknowledgeStaffCatalogueDrift,
  touchStaffCatalogueDrift,
} from "@/app/lib/prisma/staffCatalogueDrift";
import {
  invokeRoute,
  makeAuthedRequestWithUrl,
  makeUnauthedRequest,
} from "../../helpers";

const userIsSuperAdminMock = vi.fn();
const buildCatalogueSeedDataExportMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/catalogueSeedExport", () => ({
  buildCatalogueSeedDataExport: buildCatalogueSeedDataExportMock,
}));

vi.stubGlobal("fetch", fetchMock);

vi.mock("@/app/lib/prisma/client", () => {
  const prisma = {
    item: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    itemCharacter: { count: vi.fn(), deleteMany: vi.fn() },
    uniqueItem: { count: vi.fn(), delete: vi.fn() },
    pathCharacter: { count: vi.fn(), deleteMany: vi.fn() },
    vehicle: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    vehicleCharacter: { count: vi.fn(), deleteMany: vi.fn() },
    uniqueVehicle: { count: vi.fn(), delete: vi.fn() },
    enemy: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    enemyInstance: { count: vi.fn(), deleteMany: vi.fn() },
    feature: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    featureCharacter: { count: vi.fn(), deleteMany: vi.fn() },
    path: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    pathFeature: { deleteMany: vi.fn(), createMany: vi.fn() },
    map: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    referenceEntry: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
  };
  return { prisma };
});

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: vi.fn(),
  acknowledgeStaffCatalogueDrift: vi.fn(),
}));

const previewUrl = (source: string, dest: string) =>
  `http://localhost/api/staff/catalogue-sync?source=${source}&dest=${dest}`;

function emptySeedData() {
  return {
    items: [],
    vehicles: [],
    enemies: [],
    paths: [],
    features: [],
    maps: [],
    reference: [],
  };
}

function snapshotResponse(
  overrides: Partial<ReturnType<typeof emptySeedData>>
) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      exportedAt: "2026-01-01T00:00:00.000Z",
      scope: "all",
      domains: [
        "items",
        "vehicles",
        "enemies",
        "paths",
        "features",
        "maps",
        "reference",
      ],
      data: { ...emptySeedData(), ...overrides },
    }),
  };
}

async function previewDestHere() {
  const { GET } = await import("@/app/api/staff/catalogue-sync/route");
  return invokeRoute(
    GET,
    makeAuthedRequestWithUrl(previewUrl("development", "production"))
  );
}

describe("/api/staff/catalogue-sync dest preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
    buildCatalogueSeedDataExportMock.mockResolvedValue(emptySeedData());
    process.env.CATALOGUE_ENVIRONMENT = "production";
    process.env.CATALOGUE_SYNC_PULL_SECRET = "test-pull-secret";
    process.env.CATALOGUE_SYNC_DEVELOPMENT_URL = "https://dev.example.com";
    process.env.CATALOGUE_SYNC_PRODUCTION_URL = "https://prod.example.com";
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        exportedAt: "2026-01-01T00:00:00.000Z",
        scope: "all",
        domains: [
          "items",
          "vehicles",
          "enemies",
          "paths",
          "features",
          "maps",
          "reference",
        ],
        data: emptySeedData(),
      }),
    });
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(GET, {
      ...makeUnauthedRequest(),
      url: previewUrl("development", "production"),
    });
    expect(res.status).toBe(401);
    expect(buildCatalogueSeedDataExportMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GET returns 403 when not Super Admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(previewUrl("development", "production"))
    );
    expect(res.status).toBe(403);
    expect(buildCatalogueSeedDataExportMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GET returns no Official row payloads when dest is not this Catalogue environment", async () => {
    process.env.CATALOGUE_ENVIRONMENT = "development";
    const { GET } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(previewUrl("development", "production"))
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      thisEnvironment: "development",
      source: "development",
      dest: "production",
      destIsThisEnvironment: false,
      applyEnabled: false,
      destHubUrl:
        "https://prod.example.com/home/super-admin?catalogueSyncSource=development&catalogueSyncDest=production",
    });
    expect(buildCatalogueSeedDataExportMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GET returns 400 when source and dest are the same Catalogue environment", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(previewUrl("production", "production"))
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      message: "Source and destination Catalogue environments must differ.",
    });
    expect(buildCatalogueSeedDataExportMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GET returns 400 when local is chosen as source", async () => {
    process.env.CATALOGUE_ENVIRONMENT = "local";
    const { GET } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(previewUrl("local", "production"))
    );
    expect(res.status).toBe(400);
    expect(buildCatalogueSeedDataExportMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GET returns 400 when source or dest query params are missing", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl("http://localhost/api/staff/catalogue-sync")
    );
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GET returns 500 when dest is this environment but the pull secret is not configured", async () => {
    delete process.env.CATALOGUE_SYNC_PULL_SECRET;
    const { GET } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(previewUrl("development", "production"))
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({
      message: "Catalogue sync pull secret is not configured.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GET returns 400 when dest is this environment but the source pull URL is missing", async () => {
    delete process.env.CATALOGUE_SYNC_DEVELOPMENT_URL;
    const { GET } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(previewUrl("development", "production"))
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toMatch(/source pull URL/i);
    expect(buildCatalogueSeedDataExportMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GET returns 500 when this process is not configured as a Catalogue environment", async () => {
    delete process.env.CATALOGUE_ENVIRONMENT;
    const { GET } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(previewUrl("development", "production"))
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({
      message: "This process is not configured as a Catalogue environment.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GET returns 502 when dest is this environment and the source snapshot request fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthorised" }),
    });
    const { GET } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(previewUrl("development", "production"))
    );
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.message).not.toMatch(/no difference/i);
    expect(json.message).toMatch(/source/i);
  });

  it("GET returns added, updated, and dest-only buckets when dest is this Catalogue environment", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        items: [
          { id: "added-1", name: "New Official item", accessType: "PLAYER" },
          {
            id: "same-1",
            name: "Changed Official item",
            accessType: "PLAYER",
            imageKey: "items-new.png",
          },
        ],
      })
    );
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [
        {
          id: "same-1",
          name: "Changed Official item",
          accessType: "PLAYER",
          imageKey: "items-old.png",
        },
        { id: "dest-1", name: "Dest-only Official item", accessType: "PLAYER" },
      ],
    });
    const res = await previewDestHere();
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://dev.example.com/api/catalogue-sync/snapshot",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-pull-secret",
        }),
      })
    );
    const json = await res.json();
    expect(json.destIsThisEnvironment).toBe(true);
    expect(json.applyEnabled).toBe(true);
    expect(json.totals).toEqual({
      added: 1,
      updated: 1,
      destOnly: 1,
      blocked: 0,
    });
    expect(json.domains.items.rows).toEqual([
      { id: "added-1", label: "New Official item", bucket: "added" },
      { id: "same-1", label: "Changed Official item", bucket: "updated" },
      { id: "dest-1", label: "Dest-only Official item", bucket: "dest-only" },
    ]);
    expect(json.domains).not.toHaveProperty("currencies");
    expect(json.domains).not.toHaveProperty("games");
  });

  it("GET treats an Official name collision with a different id as blocked", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        items: [{ id: "src-1", name: "Siike Gun", accessType: "PLAYER" }],
      })
    );
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [{ id: "dest-2", name: "siike   gun", accessType: "GAME_MASTER" }],
    });
    const res = await previewDestHere();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.applyEnabled).toBe(false);
    expect(json.totals).toEqual({
      added: 0,
      updated: 0,
      destOnly: 1,
      blocked: 1,
    });
    expect(json.domains.items.rows).toEqual([
      { id: "src-1", label: "Siike Gun", bucket: "blocked" },
      { id: "dest-2", label: "siike   gun", bucket: "dest-only" },
    ]);
  });

  it("GET treats a published-reference slug collision with a different id as blocked", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        reference: [
          {
            id: "src-ref",
            slug: "combat-basics",
            category: "MECHANICS",
            title: "Combat",
          },
        ],
      })
    );
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      reference: [
        {
          id: "dest-ref",
          slug: "combat-basics",
          category: "MECHANICS",
          title: "Old combat",
        },
      ],
    });
    const res = await previewDestHere();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.domains.reference.rows).toEqual([
      { id: "src-ref", label: "combat-basics", bucket: "blocked" },
      { id: "dest-ref", label: "combat-basics", bucket: "dest-only" },
    ]);
  });

  it("GET ignores timestamps and protectedFromOfficialImport when comparing Official rows", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        maps: [
          {
            id: "map-1",
            name: "Neblir",
            imageKey: "maps-neblir.png",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
            protectedFromOfficialImport: false,
          },
        ],
      })
    );
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      maps: [
        {
          id: "map-1",
          name: "Neblir",
          imageKey: "maps-neblir.png",
          createdAt: "2020-01-01T00:00:00.000Z",
          updatedAt: "2020-01-02T00:00:00.000Z",
          protectedFromOfficialImport: true,
        },
      ],
    });
    const res = await previewDestHere();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.applyEnabled).toBe(false);
    expect(json.totals).toEqual({
      added: 0,
      updated: 0,
      destOnly: 0,
      blocked: 0,
    });
    expect(json.domains.maps.rows).toEqual([]);
  });

  it("GET counts imageKey and accessType differences as updated", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        items: [
          {
            id: "item-1",
            name: "Siike Gun",
            accessType: "GAME_MASTER",
            imageKey: "items-new.png",
          },
        ],
      })
    );
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [
        {
          id: "item-1",
          name: "Siike Gun",
          accessType: "PLAYER",
          imageKey: "items-old.png",
        },
      ],
    });
    const res = await previewDestHere();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.domains.items.rows).toEqual([
      { id: "item-1", label: "Siike Gun", bucket: "updated" },
    ]);
  });

  it("GET omits Custom, Unique, and game-scoped maps and published reference entries", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        maps: [
          { id: "official-map", name: "Neblir", gameId: null },
          { id: "custom-map", name: "Table map", gameId: "game-1" },
        ],
        reference: [
          {
            id: "official-ref",
            slug: "neblir",
            category: "WORLD",
            gameId: null,
          },
          {
            id: "lore-ref",
            slug: "campaign",
            category: "CAMPAIGN_LORE",
            gameId: "game-1",
          },
        ],
      })
    );
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      maps: [
        { id: "dest-custom-map", name: "Dest table map", gameId: "game-2" },
      ],
      reference: [
        {
          id: "dest-lore",
          slug: "dest-lore",
          category: "CAMPAIGN_LORE",
          gameId: "game-2",
        },
      ],
    });
    const res = await previewDestHere();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.domains.maps.rows).toEqual([
      { id: "official-map", label: "Neblir", bucket: "added" },
    ]);
    expect(json.domains.reference.rows).toEqual([
      { id: "official-ref", label: "neblir", bucket: "added" },
    ]);
    expect(json.totals.added).toBe(2);
    expect(json.totals.destOnly).toBe(0);
  });
});

const APPLY_URL = "http://localhost/api/staff/catalogue-sync";

function applyBody(
  body: Record<string, unknown> = {
    source: "development",
    dest: "production",
  }
) {
  return makeAuthedRequestWithUrl(APPLY_URL, "user-1", body);
}

function resetOfficialWriteMocks() {
  const delegates = [
    prisma.item,
    prisma.vehicle,
    prisma.enemy,
    prisma.path,
    prisma.feature,
    prisma.map,
    prisma.referenceEntry,
  ];
  for (const delegate of delegates) {
    vi.mocked(delegate.create).mockReset();
    vi.mocked(delegate.update).mockReset();
    vi.mocked(delegate.delete).mockReset();
  }
  vi.mocked(prisma.path.findMany).mockReset();
  vi.mocked(prisma.pathFeature.deleteMany).mockReset();
  vi.mocked(prisma.pathFeature.createMany).mockReset();
  vi.mocked(prisma.$transaction).mockReset();
  vi.mocked(prisma.$transaction).mockImplementation((async (fn: unknown) => {
    if (typeof fn === "function") return fn(prisma);
    return fn;
  }) as never);
  vi.mocked(touchStaffCatalogueDrift).mockReset();
  vi.mocked(touchStaffCatalogueDrift).mockResolvedValue(undefined);
  vi.mocked(acknowledgeStaffCatalogueDrift).mockReset();
  for (const findUnique of [
    prisma.item.findUnique,
    prisma.vehicle.findUnique,
    prisma.enemy.findUnique,
    prisma.feature.findUnique,
    prisma.path.findUnique,
    prisma.map.findUnique,
    prisma.referenceEntry.findUnique,
  ]) {
    vi.mocked(findUnique).mockReset();
    vi.mocked(findUnique).mockResolvedValue({
      id: "row",
      gameId: null,
    } as never);
  }
  for (const count of [
    prisma.itemCharacter.count,
    prisma.uniqueItem.count,
    prisma.pathCharacter.count,
    prisma.vehicleCharacter.count,
    prisma.uniqueVehicle.count,
    prisma.enemyInstance.count,
    prisma.featureCharacter.count,
  ]) {
    vi.mocked(count).mockReset();
    vi.mocked(count).mockResolvedValue(0 as never);
  }
}

describe("/api/staff/catalogue-sync dest apply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
    buildCatalogueSeedDataExportMock.mockResolvedValue(emptySeedData());
    resetOfficialWriteMocks();
    process.env.CATALOGUE_ENVIRONMENT = "production";
    process.env.CATALOGUE_SYNC_PULL_SECRET = "test-pull-secret";
    process.env.CATALOGUE_SYNC_DEVELOPMENT_URL = "https://dev.example.com";
    process.env.CATALOGUE_SYNC_PRODUCTION_URL = "https://prod.example.com";
    fetchMock.mockResolvedValue(snapshotResponse({}));
  });

  it("POST returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(POST, {
      ...makeUnauthedRequest({ source: "development", dest: "production" }),
      url: APPLY_URL,
    });
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(prisma.item.create).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDrift).not.toHaveBeenCalled();
  });

  it("POST returns 403 when not Super Admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(POST, applyBody());
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it("POST refuses apply when dest is not this Catalogue environment", async () => {
    process.env.CATALOGUE_ENVIRONMENT = "development";
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(POST, applyBody());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toMatch(/destination/i);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(prisma.item.create).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDrift).not.toHaveBeenCalled();
  });

  it("POST writes unblocked adds and updates, sets dest drift, and leaves dest-only rows", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        items: [
          {
            id: "added-1",
            name: "New Official item",
            accessType: "PLAYER",
            modifiesAttribute: "strength.athletics",
            createdAt: "2026-01-01T00:00:00.000Z",
            protectedFromOfficialImport: false,
          },
          {
            id: "same-1",
            name: "Changed Official item",
            accessType: "PLAYER",
            imageKey: "items-new.png",
          },
        ],
        paths: [
          {
            id: "path-1",
            name: "SOLDIER",
            description: "Fighter",
            baseFeature: "Two attacks",
          },
        ],
      })
    );
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [
        {
          id: "same-1",
          name: "Changed Official item",
          accessType: "PLAYER",
          imageKey: "items-old.png",
        },
        { id: "dest-1", name: "Dest-only Official item", accessType: "PLAYER" },
      ],
    });
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      POST,
      applyBody({
        source: "development",
        dest: "production",
        domains: ["items"],
      })
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      applied: [
        { domain: "items", id: "added-1" },
        { domain: "items", id: "same-1" },
        { domain: "paths", id: "path-1" },
      ],
      skipped: [],
      failed: [],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://dev.example.com/api/catalogue-sync/snapshot",
      expect.objectContaining({ method: "GET" })
    );
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "added-1",
        name: "New Official item",
        accessType: "PLAYER",
        modifiesAttribute: ItemAttributePath.STRENGTH_ATHLETICS,
        protectedFromOfficialImport: true,
      }),
    });
    expect(prisma.item.create).toHaveBeenCalledTimes(1);
    const created = vi.mocked(prisma.item.create).mock.calls[0]?.[0];
    expect(created?.data).not.toHaveProperty("createdAt");
    expect(prisma.item.update).toHaveBeenCalledWith({
      where: { id: "same-1" },
      data: expect.objectContaining({
        name: "Changed Official item",
        imageKey: "items-new.png",
        protectedFromOfficialImport: true,
      }),
    });
    expect(
      vi.mocked(prisma.item.update).mock.calls[0]?.[0].data
    ).not.toHaveProperty("id");
    expect(prisma.path.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "path-1",
        name: "SOLDIER",
        protectedFromOfficialImport: true,
      }),
    });
    expect(prisma.item.delete).not.toHaveBeenCalled();
    expect(prisma.path.delete).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDrift).toHaveBeenCalledTimes(1);
    expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["items", "paths"]);
    expect(acknowledgeStaffCatalogueDrift).not.toHaveBeenCalled();
  });

  it("POST skips blocked Official name collisions and still applies other rows", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        items: [
          { id: "src-1", name: "Siike Gun", accessType: "PLAYER" },
          { id: "added-2", name: "Fresh Official item", accessType: "PLAYER" },
        ],
      })
    );
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [{ id: "dest-2", name: "siike   gun", accessType: "GAME_MASTER" }],
    });
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(POST, applyBody());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      applied: [{ domain: "items", id: "added-2" }],
      skipped: [{ domain: "items", id: "src-1", reason: "blocked" }],
      failed: [],
    });
    expect(prisma.item.create).toHaveBeenCalledTimes(1);
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: "added-2" }),
    });
    expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["items"]);
  });

  it("POST keeps earlier successes when a later Official write fails", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        items: [
          { id: "ok-1", name: "Kept Official item", accessType: "PLAYER" },
          { id: "bad-1", name: "Failed Official item", accessType: "PLAYER" },
        ],
      })
    );
    vi.mocked(prisma.item.create).mockImplementation((async (args: {
      data: { id?: string };
    }) => {
      if (args.data.id === "bad-1") throw new Error("write failed");
      return { id: args.data.id };
    }) as never);
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(POST, applyBody());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      applied: [{ domain: "items", id: "ok-1" }],
      skipped: [],
      failed: [{ domain: "items", id: "bad-1", message: "write failed" }],
    });
    expect(prisma.item.delete).not.toHaveBeenCalled();
    expect(prisma.item.update).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["items"]);

    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [{ id: "ok-1", name: "Kept Official item", accessType: "PLAYER" }],
    });
    const { GET } = await import("@/app/api/staff/catalogue-sync/route");
    const preview = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(previewUrl("development", "production"))
    );
    expect(preview.status).toBe(200);
    const previewJson = await preview.json();
    expect(previewJson.domains.items.rows).toEqual([
      { id: "bad-1", label: "Failed Official item", bucket: "added" },
    ]);
    expect(previewJson.applyEnabled).toBe(true);
  });

  it("POST reports a unique-name constraint miss as blocked", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        items: [{ id: "src-1", name: "Siike Gun", accessType: "PLAYER" }],
      })
    );
    vi.mocked(prisma.item.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      })
    );
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(POST, applyBody());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      applied: [],
      skipped: [{ domain: "items", id: "src-1", reason: "blocked" }],
      failed: [],
    });
    expect(touchStaffCatalogueDrift).not.toHaveBeenCalled();
    expect(acknowledgeStaffCatalogueDrift).not.toHaveBeenCalled();
  });

  it("POST does not apply an empty overlay", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        items: [{ id: "same-1", name: "Siike Gun", accessType: "PLAYER" }],
      })
    );
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [{ id: "same-1", name: "Siike Gun", accessType: "PLAYER" }],
    });
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(POST, applyBody());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toMatch(/nothing to add or update/i);
    expect(prisma.item.create).not.toHaveBeenCalled();
    expect(prisma.item.update).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDrift).not.toHaveBeenCalled();
  });

  it("POST does not apply when dest-only delete is on and nothing is dest-only", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        items: [{ id: "same-1", name: "Siike Gun", accessType: "PLAYER" }],
      })
    );
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [{ id: "same-1", name: "Siike Gun", accessType: "PLAYER" }],
    });
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      POST,
      applyBody({
        source: "development",
        dest: "production",
        deleteDestOnly: true,
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toMatch(/nothing to add, update, or delete/i);
    expect(prisma.item.delete).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDrift).not.toHaveBeenCalled();
  });

  it("POST does not apply when the only rows are blocked or dest-only", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        items: [{ id: "src-1", name: "Siike Gun", accessType: "PLAYER" }],
      })
    );
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [{ id: "dest-2", name: "siike   gun", accessType: "GAME_MASTER" }],
    });
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(POST, applyBody());
    expect(res.status).toBe(400);
    expect(prisma.item.create).not.toHaveBeenCalled();
    expect(prisma.item.delete).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDrift).not.toHaveBeenCalled();
  });

  it("POST apply is idempotent once dest already matches the source row", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        items: [
          { id: "added-1", name: "New Official item", accessType: "PLAYER" },
        ],
      })
    );
    const { POST, GET } = await import("@/app/api/staff/catalogue-sync/route");
    const first = await invokeRoute(POST, applyBody());
    expect(first.status).toBe(200);
    expect(prisma.item.create).toHaveBeenCalledTimes(1);

    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [
        { id: "added-1", name: "New Official item", accessType: "PLAYER" },
      ],
    });
    const second = await invokeRoute(POST, applyBody());
    expect(second.status).toBe(400);
    const secondJson = await second.json();
    expect(secondJson.message).toMatch(/nothing to add or update/i);
    expect(prisma.item.create).toHaveBeenCalledTimes(1);

    const preview = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(previewUrl("development", "production"))
    );
    expect(preview.status).toBe(200);
    const previewJson = await preview.json();
    expect(previewJson.domains.items.rows).toEqual([]);
    expect(previewJson.applyEnabled).toBe(false);
  });

  it("POST feature overlay rebuilds path links for applicable paths", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        features: [
          {
            id: "feat-1",
            name: "Two Attacks",
            description: "Strike twice",
            minPathRank: 1,
            maxGrade: 1,
            examples: [],
            applicablePaths: ["SOLDIER"],
          },
        ],
      })
    );
    vi.mocked(prisma.path.findMany).mockResolvedValue([
      { id: "path-1", name: "SOLDIER" },
    ] as never);
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(POST, applyBody());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      applied: [{ domain: "features", id: "feat-1" }],
      skipped: [],
      failed: [],
    });
    expect(prisma.feature.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "feat-1",
        name: "Two Attacks",
        applicablePaths: ["SOLDIER"],
        protectedFromOfficialImport: true,
      }),
    });
    expect(prisma.pathFeature.deleteMany).toHaveBeenCalledWith({
      where: { featureId: "feat-1" },
    });
    expect(prisma.pathFeature.createMany).toHaveBeenCalledWith({
      data: [{ pathId: "path-1", featureId: "feat-1" }],
    });
    expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["features"]);
  });

  it("POST with dest-only delete off leaves dest-only Official rows", async () => {
    fetchMock.mockResolvedValue(
      snapshotResponse({
        items: [
          { id: "added-1", name: "New Official item", accessType: "PLAYER" },
        ],
      })
    );
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [
        { id: "dest-1", name: "Dest-only Official item", accessType: "PLAYER" },
      ],
    });
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      POST,
      applyBody({
        source: "development",
        dest: "production",
        deleteDestOnly: false,
      })
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      applied: [{ domain: "items", id: "added-1" }],
      skipped: [],
      failed: [],
    });
    expect(prisma.item.delete).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["items"]);
  });

  it("POST deletes an unused dest-only Official item when dest-only delete is on", async () => {
    fetchMock.mockResolvedValue(snapshotResponse({}));
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [
        { id: "dest-1", name: "Retired Official item", accessType: "PLAYER" },
      ],
    });
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      POST,
      applyBody({
        source: "development",
        dest: "production",
        deleteDestOnly: true,
      })
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      applied: [{ domain: "items", id: "dest-1", action: "delete" }],
      skipped: [],
      failed: [],
    });
    expect(prisma.item.delete).toHaveBeenCalledWith({
      where: { id: "dest-1" },
    });
    expect(prisma.itemCharacter.deleteMany).not.toHaveBeenCalled();
    expect(prisma.uniqueItem.delete).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["items"]);
  });

  it("POST blocks an in-use dest-only Official item and leaves it on dest", async () => {
    fetchMock.mockResolvedValue(snapshotResponse({}));
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [
        { id: "held-1", name: "Held Official item", accessType: "PLAYER" },
      ],
    });
    vi.mocked(prisma.itemCharacter.count).mockImplementation((async (args: {
      where?: { itemId?: string };
    }) => (args?.where?.itemId === "held-1" ? 1 : 0)) as never);
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      POST,
      applyBody({
        source: "development",
        dest: "production",
        deleteDestOnly: true,
      })
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      applied: [],
      skipped: [{ domain: "items", id: "held-1", reason: "blocked" }],
      failed: [],
    });
    expect(prisma.item.delete).not.toHaveBeenCalled();
    expect(prisma.itemCharacter.deleteMany).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDrift).not.toHaveBeenCalled();
  });

  it("POST deletes unused dest-only Official rows in every catalogue domain", async () => {
    fetchMock.mockResolvedValue(snapshotResponse({}));
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      items: [{ id: "item-1", name: "Old item", accessType: "PLAYER" }],
      vehicles: [{ id: "veh-1", name: "Old vehicle", accessType: "PLAYER" }],
      enemies: [{ id: "enemy-1", name: "Old enemy" }],
      paths: [
        {
          id: "path-1",
          name: "SOLDIER",
          description: "Fighter",
          baseFeature: "Two attacks",
        },
      ],
      features: [
        {
          id: "feat-1",
          name: "Old feature",
          description: "Strike",
          minPathRank: 1,
          maxGrade: 1,
          examples: [],
          applicablePaths: [],
        },
      ],
      maps: [{ id: "map-1", name: "Old map", imageKey: "maps-old.png" }],
      reference: [
        {
          id: "ref-1",
          slug: "old-ref",
          category: "MECHANICS",
          title: "Old",
        },
      ],
    });
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      POST,
      applyBody({
        source: "development",
        dest: "production",
        deleteDestOnly: true,
      })
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      applied: [
        { domain: "items", id: "item-1", action: "delete" },
        { domain: "vehicles", id: "veh-1", action: "delete" },
        { domain: "enemies", id: "enemy-1", action: "delete" },
        { domain: "paths", id: "path-1", action: "delete" },
        { domain: "features", id: "feat-1", action: "delete" },
        { domain: "maps", id: "map-1", action: "delete" },
        { domain: "reference", id: "ref-1", action: "delete" },
      ],
      skipped: [],
      failed: [],
    });
    expect(prisma.item.delete).toHaveBeenCalledWith({
      where: { id: "item-1" },
    });
    expect(prisma.vehicle.delete).toHaveBeenCalledWith({
      where: { id: "veh-1" },
    });
    expect(prisma.enemy.delete).toHaveBeenCalledWith({
      where: { id: "enemy-1" },
    });
    expect(prisma.path.delete).toHaveBeenCalledWith({
      where: { id: "path-1" },
    });
    expect(prisma.feature.delete).toHaveBeenCalledWith({
      where: { id: "feat-1" },
    });
    expect(prisma.map.delete).toHaveBeenCalledWith({ where: { id: "map-1" } });
    expect(prisma.referenceEntry.delete).toHaveBeenCalledWith({
      where: { id: "ref-1" },
    });
    expect(prisma.enemyInstance.deleteMany).not.toHaveBeenCalled();
    expect(prisma.featureCharacter.deleteMany).not.toHaveBeenCalled();
    expect(prisma.pathCharacter.deleteMany).not.toHaveBeenCalled();
    expect(prisma.pathFeature.deleteMany).toHaveBeenCalledWith({
      where: { pathId: "path-1" },
    });
    expect(prisma.pathFeature.deleteMany).toHaveBeenCalledWith({
      where: { featureId: "feat-1" },
    });
    expect(touchStaffCatalogueDrift).toHaveBeenCalledWith([
      "items",
      "vehicles",
      "enemies",
      "paths",
      "features",
      "maps",
      "reference",
    ]);
  });

  it("POST blocks dest-only rows that Official usage already counts and does not clean them up", async () => {
    fetchMock.mockResolvedValue(snapshotResponse({}));
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      items: [
        { id: "held-1", name: "Held item", accessType: "PLAYER" },
        { id: "unique-1", name: "Unique template", accessType: "PLAYER" },
        { id: "fav-1", name: "Favourite weapon", accessType: "PLAYER" },
      ],
      vehicles: [
        { id: "held-veh", name: "Held vehicle", accessType: "PLAYER" },
        {
          id: "unique-veh",
          name: "Unique vehicle template",
          accessType: "PLAYER",
        },
      ],
      enemies: [{ id: "spawned-1", name: "Spawned enemy" }],
      paths: [
        {
          id: "path-used",
          name: "SOLDIER",
          description: "Fighter",
          baseFeature: "Two attacks",
        },
      ],
      features: [
        {
          id: "granted-1",
          name: "Granted feature",
          description: "Strike",
          minPathRank: 1,
          maxGrade: 1,
          examples: [],
          applicablePaths: ["SOLDIER"],
        },
      ],
      maps: [],
      reference: [],
    });
    vi.mocked(prisma.itemCharacter.count).mockImplementation((async (args: {
      where?: { itemId?: string };
    }) => (args?.where?.itemId === "held-1" ? 2 : 0)) as never);
    vi.mocked(prisma.uniqueItem.count).mockImplementation((async (args: {
      where?: { itemId?: string };
    }) => (args?.where?.itemId === "unique-1" ? 1 : 0)) as never);
    vi.mocked(prisma.pathCharacter.count).mockImplementation((async (args: {
      where?: { favouriteWeaponItemId?: string; pathId?: string };
    }) => {
      if (args?.where?.favouriteWeaponItemId === "fav-1") return 1;
      if (args?.where?.pathId === "path-used") return 3;
      return 0;
    }) as never);
    vi.mocked(prisma.vehicleCharacter.count).mockImplementation((async (args: {
      where?: { vehicleId?: string };
    }) => (args?.where?.vehicleId === "held-veh" ? 1 : 0)) as never);
    vi.mocked(prisma.uniqueVehicle.count).mockImplementation((async (args: {
      where?: { vehicleId?: string };
    }) => (args?.where?.vehicleId === "unique-veh" ? 1 : 0)) as never);
    vi.mocked(prisma.enemyInstance.count).mockImplementation((async (args: {
      where?: { sourceOfficialEnemyId?: string };
    }) =>
      args?.where?.sourceOfficialEnemyId === "spawned-1" ? 4 : 0) as never);
    vi.mocked(prisma.featureCharacter.count).mockImplementation((async (args: {
      where?: { featureId?: string };
    }) => (args?.where?.featureId === "granted-1" ? 1 : 0)) as never);

    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      POST,
      applyBody({
        source: "development",
        dest: "production",
        deleteDestOnly: true,
      })
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      applied: [],
      skipped: [
        { domain: "items", id: "held-1", reason: "blocked" },
        { domain: "items", id: "unique-1", reason: "blocked" },
        { domain: "items", id: "fav-1", reason: "blocked" },
        { domain: "vehicles", id: "held-veh", reason: "blocked" },
        { domain: "vehicles", id: "unique-veh", reason: "blocked" },
        { domain: "enemies", id: "spawned-1", reason: "blocked" },
        { domain: "paths", id: "path-used", reason: "blocked" },
        { domain: "features", id: "granted-1", reason: "blocked" },
      ],
      failed: [],
    });
    expect(prisma.item.delete).not.toHaveBeenCalled();
    expect(prisma.vehicle.delete).not.toHaveBeenCalled();
    expect(prisma.enemy.delete).not.toHaveBeenCalled();
    expect(prisma.path.delete).not.toHaveBeenCalled();
    expect(prisma.feature.delete).not.toHaveBeenCalled();
    expect(prisma.itemCharacter.deleteMany).not.toHaveBeenCalled();
    expect(prisma.uniqueItem.delete).not.toHaveBeenCalled();
    expect(prisma.vehicleCharacter.deleteMany).not.toHaveBeenCalled();
    expect(prisma.uniqueVehicle.delete).not.toHaveBeenCalled();
    expect(prisma.enemyInstance.deleteMany).not.toHaveBeenCalled();
    expect(prisma.featureCharacter.deleteMany).not.toHaveBeenCalled();
    expect(prisma.pathCharacter.deleteMany).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDrift).not.toHaveBeenCalled();
  });

  it("POST touches dest drift only for catalogue domains where dest-only deletes landed", async () => {
    fetchMock.mockResolvedValue(snapshotResponse({}));
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [{ id: "item-1", name: "Unused item", accessType: "PLAYER" }],
      vehicles: [
        { id: "held-veh", name: "Held vehicle", accessType: "PLAYER" },
      ],
    });
    vi.mocked(prisma.vehicleCharacter.count).mockResolvedValue(1 as never);
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      POST,
      applyBody({
        source: "development",
        dest: "production",
        deleteDestOnly: true,
      })
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      applied: [{ domain: "items", id: "item-1", action: "delete" }],
      skipped: [{ domain: "vehicles", id: "held-veh", reason: "blocked" }],
      failed: [],
    });
    expect(prisma.vehicle.delete).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDrift).toHaveBeenCalledTimes(1);
    expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["items"]);
  });

  it("POST keeps an earlier dest-only delete when a later one fails", async () => {
    fetchMock.mockResolvedValue(snapshotResponse({}));
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [{ id: "item-1", name: "Unused item", accessType: "PLAYER" }],
      vehicles: [{ id: "veh-1", name: "Unused vehicle", accessType: "PLAYER" }],
    });
    vi.mocked(prisma.vehicle.delete).mockRejectedValue(
      new Error("delete failed")
    );
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      POST,
      applyBody({
        source: "development",
        dest: "production",
        deleteDestOnly: true,
      })
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      applied: [{ domain: "items", id: "item-1", action: "delete" }],
      skipped: [],
      failed: [{ domain: "vehicles", id: "veh-1", message: "delete failed" }],
    });
    expect(prisma.item.delete).toHaveBeenCalledWith({
      where: { id: "item-1" },
    });
    expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["items"]);
    expect(acknowledgeStaffCatalogueDrift).not.toHaveBeenCalled();
  });

  it("POST returns 400 when dest-only delete is not a boolean", async () => {
    const { POST } = await import("@/app/api/staff/catalogue-sync/route");
    const res = await invokeRoute(
      POST,
      applyBody({
        source: "development",
        dest: "production",
        deleteDestOnly: "yes",
      })
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      message: "Dest-only delete must be true or false.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(prisma.item.delete).not.toHaveBeenCalled();
    expect(touchStaffCatalogueDrift).not.toHaveBeenCalled();
  });

  it("GET with dest-only delete counts unused deletes and in-use skips before apply", async () => {
    fetchMock.mockResolvedValue(snapshotResponse({}));
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      ...emptySeedData(),
      items: [
        { id: "unused-1", name: "Unused Official item", accessType: "PLAYER" },
        { id: "held-1", name: "Held Official item", accessType: "PLAYER" },
      ],
    });
    vi.mocked(prisma.itemCharacter.count).mockImplementation((async (args: {
      where?: { itemId?: string };
    }) => (args?.where?.itemId === "held-1" ? 1 : 0)) as never);
    const { GET } = await import("@/app/api/staff/catalogue-sync/route");
    const plain = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(previewUrl("development", "production"))
    );
    expect(plain.status).toBe(200);
    const plainJson = await plain.json();
    expect(plainJson.applyEnabled).toBe(false);
    expect(plainJson.destOnlyDelete).toBeUndefined();
    expect(plainJson.totals).toEqual({
      added: 0,
      updated: 0,
      destOnly: 2,
      blocked: 0,
    });

    const optedIn = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(
        `${previewUrl("development", "production")}&deleteDestOnly=true`
      )
    );
    expect(optedIn.status).toBe(200);
    const json = await optedIn.json();
    expect(json.applyEnabled).toBe(true);
    expect(json.destOnlyDelete).toEqual({ apply: 1, skip: 1 });
    expect(json.totals).toEqual({
      added: 0,
      updated: 0,
      destOnly: 1,
      blocked: 1,
    });
    expect(json.domains.items.rows).toEqual([
      { id: "unused-1", label: "Unused Official item", bucket: "dest-only" },
      { id: "held-1", label: "Held Official item", bucket: "blocked" },
    ]);
  });
});
