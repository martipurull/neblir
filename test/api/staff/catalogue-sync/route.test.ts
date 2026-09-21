import { beforeEach, describe, expect, it, vi } from "vitest";
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
    expect(json.applyEnabled).toBe(false);
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
