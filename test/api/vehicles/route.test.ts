import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const createVehicleMock = vi.fn();
const getVehiclesMock = vi.fn();
const safeParseMock = vi.fn();
const userIsSuperAdminMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/lib/prisma/vehicle", () => ({
  createVehicle: createVehicleMock,
  getVehicles: getVehiclesMock,
}));

vi.mock("@/app/lib/types/vehicle", () => ({
  vehicleSchema: { safeParse: safeParseMock },
}));

describe("/api/vehicles route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
  });

  it("POST returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/vehicles/route");
    const response = await invokeRoute(POST, makeUnauthedRequest({}));
    expect(response.status).toBe(401);
  });

  it("POST returns 403 when not super admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/vehicles/route");
    const response = await invokeRoute(POST, makeAuthedRequest({ name: "X" }));
    expect(response.status).toBe(403);
    expect(createVehicleMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 on invalid request body", async () => {
    safeParseMock.mockReturnValue({
      error: { issues: [{ message: "invalid" }] },
      data: undefined,
    });
    const { POST } = await import("@/app/api/vehicles/route");

    const response = await invokeRoute(POST, makeAuthedRequest({ bad: true }));
    expect(response.status).toBe(400);
  });

  it("POST returns 201 on success", async () => {
    safeParseMock.mockReturnValue({
      data: { name: "Bike" },
      error: undefined,
    });
    createVehicleMock.mockResolvedValue({ id: "vehicle-1", name: "Bike" });
    const { POST } = await import("@/app/api/vehicles/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ name: "Bike" })
    );
    expect(response.status).toBe(201);
    expect(createVehicleMock).toHaveBeenCalledWith(
      { name: "Bike" },
      { officialCatalogueWrite: true }
    );
  });

  it("GET returns 200 with vehicles for authenticated users", async () => {
    getVehiclesMock.mockResolvedValue([{ id: "vehicle-1" }]);
    const { GET } = await import("@/app/api/vehicles/route");

    const response = await invokeRoute(GET, makeAuthedRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ id: "vehicle-1" }]);
  });
});
