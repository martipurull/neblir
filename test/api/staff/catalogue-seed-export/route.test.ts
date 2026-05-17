import { beforeEach, describe, expect, it, vi } from "vitest";
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
});
