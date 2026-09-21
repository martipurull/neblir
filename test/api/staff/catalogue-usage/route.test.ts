import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequestWithUrl,
  makeUnauthedRequest,
} from "../../helpers";

const userIsSuperAdminMock = vi.fn();
const getOfficialCatalogueUsageMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/officialCatalogueUsage", () => ({
  getOfficialCatalogueUsage: getOfficialCatalogueUsageMock,
}));

const usageUrl = (query: string) =>
  `http://localhost/api/staff/catalogue-usage?${query}`;

describe("/api/staff/catalogue-usage route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-usage/route");
    const res = await invokeRoute(GET, {
      ...makeUnauthedRequest(),
      url: usageUrl("domain=items&id=item-1"),
    });
    expect(res.status).toBe(401);
    expect(getOfficialCatalogueUsageMock).not.toHaveBeenCalled();
  });

  it("GET returns 403 when not super admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/staff/catalogue-usage/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(usageUrl("domain=items&id=item-1"))
    );
    expect(res.status).toBe(403);
    expect(getOfficialCatalogueUsageMock).not.toHaveBeenCalled();
  });

  it("GET returns 400 when domain is missing or not a deletable catalogue domain", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-usage/route");
    const missing = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(usageUrl("id=item-1"))
    );
    const paths = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(usageUrl("domain=paths&id=path-1"))
    );
    expect(missing.status).toBe(400);
    expect(paths.status).toBe(400);
    expect(getOfficialCatalogueUsageMock).not.toHaveBeenCalled();
  });

  it("GET returns 400 when id is missing", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-usage/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(usageUrl("domain=items"))
    );
    expect(res.status).toBe(400);
    expect(getOfficialCatalogueUsageMock).not.toHaveBeenCalled();
  });

  it("GET returns 404 when the Official row is missing", async () => {
    getOfficialCatalogueUsageMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/staff/catalogue-usage/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(usageUrl("domain=items&id=missing"))
    );
    expect(res.status).toBe(404);
  });

  it("GET returns 200 with the in-play breakdown for a Super Admin", async () => {
    const breakdown = {
      characters: 2,
      uniqueItems: 1,
      uniqueVehicles: 0,
      enemyInstances: 0,
      favouriteWeaponRows: 3,
      featureGrants: 0,
    };
    getOfficialCatalogueUsageMock.mockResolvedValue(breakdown);
    const { GET } = await import("@/app/api/staff/catalogue-usage/route");
    const res = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(usageUrl("domain=items&id=item-1"))
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(breakdown);
    expect(getOfficialCatalogueUsageMock).toHaveBeenCalledWith(
      "items",
      "item-1"
    );
  });
});
