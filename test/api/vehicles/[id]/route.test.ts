import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const getVehicleMock = vi.fn();
const updateVehicleMock = vi.fn();
const deleteVehicleMock = vi.fn();
const safeParseMock = vi.fn();
const userIsSuperAdminMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/lib/prisma/vehicle", () => ({
  getVehicle: getVehicleMock,
  updateVehicle: updateVehicleMock,
  deleteVehicle: deleteVehicleMock,
}));

vi.mock("@/app/lib/types/vehicle", () => ({
  vehicleUpdateSchema: { safeParse: safeParseMock },
}));

describe("/api/vehicles/[id] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/vehicles/[id]/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "vehicle-1" })
    );
    expect(response.status).toBe(401);
  });

  it("GET returns 400 on missing id", async () => {
    const { GET } = await import("@/app/api/vehicles/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "" })
    );
    expect(response.status).toBe(400);
  });

  it("PATCH returns 400 on invalid body", async () => {
    safeParseMock.mockReturnValue({
      error: { issues: [{ message: "bad patch body" }] },
      data: undefined,
    });
    const { PATCH } = await import("@/app/api/vehicles/[id]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ bad: true }),
      makeParams({ id: "vehicle-1" })
    );
    expect(response.status).toBe(400);
  });

  it("PATCH returns 403 when requester is not a super admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { PATCH } = await import("@/app/api/vehicles/[id]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "Updated" }),
      makeParams({ id: "vehicle-1" })
    );
    expect(response.status).toBe(403);
    expect(updateVehicleMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 200 on success", async () => {
    safeParseMock.mockReturnValue({
      data: { name: "Updated" },
      error: undefined,
    });
    updateVehicleMock.mockResolvedValue({ id: "vehicle-1", name: "Updated" });
    const { PATCH } = await import("@/app/api/vehicles/[id]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "Updated" }),
      makeParams({ id: "vehicle-1" })
    );
    expect(response.status).toBe(200);
    expect(updateVehicleMock).toHaveBeenCalledWith(
      "vehicle-1",
      { name: "Updated" },
      { officialCatalogueWrite: true }
    );
  });

  it("DELETE returns 403 when requester is not a super admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { DELETE } = await import("@/app/api/vehicles/[id]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "vehicle-1" })
    );
    expect(response.status).toBe(403);
    expect(deleteVehicleMock).not.toHaveBeenCalled();
  });

  it("DELETE returns 204 on success", async () => {
    deleteVehicleMock.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/vehicles/[id]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "vehicle-1" })
    );
    expect(response.status).toBe(204);
    expect(deleteVehicleMock).toHaveBeenCalledWith("vehicle-1");
  });

  it("DELETE returns 500 when delete fails", async () => {
    deleteVehicleMock.mockRejectedValue(new Error("db fail"));
    const { DELETE } = await import("@/app/api/vehicles/[id]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "vehicle-1" })
    );
    expect(response.status).toBe(500);
  });
});
