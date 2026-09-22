import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeRequestWithUrlAndHeaders } from "../../helpers";

const buildCatalogueSeedDataExportMock = vi.fn();

vi.mock("@/app/lib/catalogueSeedExport", () => ({
  buildCatalogueSeedDataExport: buildCatalogueSeedDataExportMock,
}));

const SNAPSHOT_URL = "http://localhost/api/catalogue-sync/snapshot";

describe("/api/catalogue-sync/snapshot route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CATALOGUE_SYNC_PULL_SECRET = "test-pull-secret";
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      items: [{ id: "i1", name: "Siike Gun" }],
      vehicles: [],
      enemies: [],
      paths: [],
      features: [],
      maps: [],
      reference: [],
    });
  });

  it("GET returns 401 when the server pull secret is not configured", async () => {
    delete process.env.CATALOGUE_SYNC_PULL_SECRET;
    const { GET } = await import("@/app/api/catalogue-sync/snapshot/route");
    const res = await invokeRoute(
      GET,
      makeRequestWithUrlAndHeaders(SNAPSHOT_URL, {
        authorization: "Bearer test-pull-secret",
      })
    );
    expect(res.status).toBe(401);
    expect(buildCatalogueSeedDataExportMock).not.toHaveBeenCalled();
  });

  it("GET returns 401 when the pull secret is missing", async () => {
    const { GET } = await import("@/app/api/catalogue-sync/snapshot/route");
    const res = await invokeRoute(
      GET,
      makeRequestWithUrlAndHeaders(SNAPSHOT_URL, {})
    );
    expect(res.status).toBe(401);
    expect(buildCatalogueSeedDataExportMock).not.toHaveBeenCalled();
  });

  it("GET returns 401 when the pull secret is wrong", async () => {
    const { GET } = await import("@/app/api/catalogue-sync/snapshot/route");
    const res = await invokeRoute(
      GET,
      makeRequestWithUrlAndHeaders(SNAPSHOT_URL, {
        authorization: "Bearer wrong-secret",
      })
    );
    expect(res.status).toBe(401);
    expect(buildCatalogueSeedDataExportMock).not.toHaveBeenCalled();
  });

  it("GET returns 401 when a cookie session is present without a pull secret", async () => {
    const { GET } = await import("@/app/api/catalogue-sync/snapshot/route");
    const res = await invokeRoute(
      GET,
      makeRequestWithUrlAndHeaders(
        SNAPSHOT_URL,
        {},
        { auth: { user: { id: "user-1" } } }
      )
    );
    expect(res.status).toBe(401);
    expect(buildCatalogueSeedDataExportMock).not.toHaveBeenCalled();
  });

  it("GET returns Official seed-export scope=all for all seven catalogue domains when the pull secret matches", async () => {
    const { GET } = await import("@/app/api/catalogue-sync/snapshot/route");
    const res = await invokeRoute(
      GET,
      makeRequestWithUrlAndHeaders(SNAPSHOT_URL, {
        authorization: "Bearer test-pull-secret",
      })
    );
    expect(res.status).toBe(200);
    expect(buildCatalogueSeedDataExportMock).toHaveBeenCalledWith([
      "items",
      "vehicles",
      "enemies",
      "paths",
      "features",
      "maps",
      "reference",
    ]);
    const json = await res.json();
    expect(json.scope).toBe("all");
    expect(json.domains).toEqual([
      "items",
      "vehicles",
      "enemies",
      "paths",
      "features",
      "maps",
      "reference",
    ]);
    expect(json.data.items).toEqual([{ id: "i1", name: "Siike Gun" }]);
    expect(json.data).not.toHaveProperty("games");
    expect(json.data).not.toHaveProperty("characters");
    expect(json.data).not.toHaveProperty("currencies");
    expect(typeof json.exportedAt).toBe("string");
  });

  it("GET returns 500 when Official export fails", async () => {
    buildCatalogueSeedDataExportMock.mockRejectedValue(new Error("db down"));
    const { GET } = await import("@/app/api/catalogue-sync/snapshot/route");
    const res = await invokeRoute(
      GET,
      makeRequestWithUrlAndHeaders(SNAPSHOT_URL, {
        authorization: "Bearer test-pull-secret",
      })
    );
    expect(res.status).toBe(500);
  });
});
