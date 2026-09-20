import { beforeEach, describe, expect, it, vi } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import {
  invokeRoute,
  makeAuthedRequestWithUrl,
  makeUnauthedRequest,
} from "../../helpers";

const userIsSuperAdminMock = vi.fn();
const getStaffCatalogueDriftStateMock = vi.fn();
const buildCatalogueSeedDataExportMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  getStaffCatalogueDriftState: getStaffCatalogueDriftStateMock,
}));

vi.mock("@/app/lib/catalogueSeedExport", () => ({
  buildCatalogueSeedDataExport: buildCatalogueSeedDataExportMock,
}));

describe("/api/staff/catalogue-seed-export route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
    getStaffCatalogueDriftStateMock.mockResolvedValue({
      needsSeedRepoUpdate: true,
      touchedDomains: ["items"],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      items: [{ id: "x", name: "Test" }],
    });
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-seed-export/route");
    const res = await invokeRoute(GET, {
      ...makeUnauthedRequest(),
      url: "http://localhost/api/staff/catalogue-seed-export",
    });
    expect(res.status).toBe(401);
  });

  it("GET returns 403 when not super admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/staff/catalogue-seed-export/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(
        "http://localhost/api/staff/catalogue-seed-export"
      )
    );
    expect(res.status).toBe(403);
    expect(buildCatalogueSeedDataExportMock).not.toHaveBeenCalled();
  });

  it("GET returns 400 for invalid scope", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-seed-export/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(
        "http://localhost/api/staff/catalogue-seed-export?scope=invalid"
      )
    );
    expect(res.status).toBe(400);
  });

  it("GET returns 200 and calls export for touched scope", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-seed-export/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(
        "http://localhost/api/staff/catalogue-seed-export?scope=touched"
      )
    );
    expect(res.status).toBe(200);
    expect(buildCatalogueSeedDataExportMock).toHaveBeenCalledWith(["items"]);
    const json = await res.json();
    expect(json.scope).toBe("touched");
    expect(json.domains).toEqual(["items"]);
    expect(json.data.items).toHaveLength(1);
    expect(typeof json.exportedAt).toBe("string");
  });

  it("GET returns 400 when domains param lists unknown domain", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-seed-export/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(
        "http://localhost/api/staff/catalogue-seed-export?scope=all&domains=items,bad"
      )
    );
    expect(res.status).toBe(400);
    expect(buildCatalogueSeedDataExportMock).not.toHaveBeenCalled();
  });

  it("GET returns 400 for invalid format", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-seed-export/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(
        "http://localhost/api/staff/catalogue-seed-export?format=csv"
      )
    );
    expect(res.status).toBe(400);
    expect(buildCatalogueSeedDataExportMock).not.toHaveBeenCalled();
  });

  it("GET format=array returns a JSON array with the git seed filename", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-seed-export/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(
        "http://localhost/api/staff/catalogue-seed-export?format=array&domains=items"
      )
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(res.headers.get("Content-Disposition")).toContain(
      'filename="Item_Upload.json"'
    );
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toEqual([{ id: "x", name: "Test" }]);
    expect(body).not.toHaveProperty("exportedAt");
    expect(body).not.toHaveProperty("data");
  });

  it("GET format=array returns 400 when more than one domain is selected", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-seed-export/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(
        "http://localhost/api/staff/catalogue-seed-export?format=array&scope=all&domains=items,vehicles"
      )
    );
    expect(res.status).toBe(400);
    expect(buildCatalogueSeedDataExportMock).not.toHaveBeenCalled();
  });

  it("GET format=zip returns a zip of git seed files for all domains", async () => {
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      items: [{ id: "i1" }],
      vehicles: [{ id: "v1" }],
      enemies: [{ id: "e1" }],
      paths: [{ id: "p1" }],
      features: [{ id: "f1" }],
      maps: [{ id: "m1" }],
      reference: [{ id: "r1" }],
    });
    const { GET } = await import("@/app/api/staff/catalogue-seed-export/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(
        "http://localhost/api/staff/catalogue-seed-export?format=zip&scope=all"
      )
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/zip");
    const cd = res.headers.get("Content-Disposition");
    expect(cd).toContain("attachment");
    expect(cd).toMatch(/filename="[^"]+\.zip"/);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const files = unzipSync(bytes);
    expect(Object.keys(files).sort()).toEqual(
      [
        "Enemy_Upload.json",
        "Feature_Upload.json",
        "Item_Upload.json",
        "Map_Upload.json",
        "Path_Upload.json",
        "Reference_Upload.json",
        "Vehicle_Upload.json",
      ].sort()
    );
    expect(JSON.parse(strFromU8(files["Item_Upload.json"]))).toEqual([
      { id: "i1" },
    ]);
    expect(JSON.parse(strFromU8(files["Vehicle_Upload.json"]))).toEqual([
      { id: "v1" },
    ]);
  });

  it("GET format=zip of touched domains includes only those seed files", async () => {
    getStaffCatalogueDriftStateMock.mockResolvedValue({
      needsSeedRepoUpdate: true,
      touchedDomains: ["items", "enemies"],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    buildCatalogueSeedDataExportMock.mockResolvedValue({
      items: [{ id: "i1" }],
      enemies: [{ id: "e1" }],
    });
    const { GET } = await import("@/app/api/staff/catalogue-seed-export/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(
        "http://localhost/api/staff/catalogue-seed-export?format=zip&scope=touched"
      )
    );
    expect(res.status).toBe(200);
    expect(buildCatalogueSeedDataExportMock).toHaveBeenCalledWith([
      "items",
      "enemies",
    ]);
    const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
    expect(Object.keys(files).sort()).toEqual(
      ["Enemy_Upload.json", "Item_Upload.json"].sort()
    );
  });
});
