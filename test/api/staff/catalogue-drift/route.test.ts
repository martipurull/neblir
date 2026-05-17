import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../../helpers";

const userIsSuperAdminMock = vi.fn();
const getStaffCatalogueDriftStateMock = vi.fn();
const acknowledgeStaffCatalogueDriftMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  getStaffCatalogueDriftState: getStaffCatalogueDriftStateMock,
  acknowledgeStaffCatalogueDrift: acknowledgeStaffCatalogueDriftMock,
}));

describe("/api/staff/catalogue-drift route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
    getStaffCatalogueDriftStateMock.mockResolvedValue({
      needsSeedRepoUpdate: true,
      touchedDomains: ["items"],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    acknowledgeStaffCatalogueDriftMock.mockResolvedValue(undefined);
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-drift/route");
    const response = await invokeRoute(GET, makeUnauthedRequest());
    expect(response.status).toBe(401);
  });

  it("GET returns 403 when not super admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/staff/catalogue-drift/route");
    const response = await invokeRoute(GET, makeAuthedRequest());
    expect(response.status).toBe(403);
  });

  it("GET returns 200 with drift payload for super admin", async () => {
    const { GET } = await import("@/app/api/staff/catalogue-drift/route");
    const response = await invokeRoute(GET, makeAuthedRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      needsSeedRepoUpdate: true,
      touchedDomains: ["items"],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("PATCH returns 403 when not super admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { PATCH } = await import("@/app/api/staff/catalogue-drift/route");
    const response = await invokeRoute(PATCH, makeAuthedRequest());
    expect(response.status).toBe(403);
    expect(acknowledgeStaffCatalogueDriftMock).not.toHaveBeenCalled();
  });

  it("PATCH acknowledges and returns updated state", async () => {
    getStaffCatalogueDriftStateMock.mockResolvedValue({
      needsSeedRepoUpdate: false,
      touchedDomains: [],
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    const { PATCH } = await import("@/app/api/staff/catalogue-drift/route");
    const response = await invokeRoute(PATCH, makeAuthedRequest());
    expect(response.status).toBe(200);
    expect(acknowledgeStaffCatalogueDriftMock).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      needsSeedRepoUpdate: false,
      touchedDomains: [],
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });
});
