import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const userIsSuperAdminMock = vi.fn();
const getFeatureMock = vi.fn();
const updateFeatureCatalogueMock = vi.fn();
const deleteFeatureCatalogueMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/lib/prisma/feature", () => ({
  getFeature: getFeatureMock,
  updateFeatureCatalogue: updateFeatureCatalogueMock,
  deleteFeatureCatalogue: deleteFeatureCatalogueMock,
}));

describe("/api/features/[id] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import("@/app/api/features/[id]/route");
      const response = await invokeRoute(
        GET,
        makeUnauthedRequest(),
        makeParams({ id: "f-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when not super admin", async () => {
      userIsSuperAdminMock.mockResolvedValue(false);
      const { GET } = await import("@/app/api/features/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "f-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 404 when missing", async () => {
      getFeatureMock.mockResolvedValue(null);
      const { GET } = await import("@/app/api/features/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "f-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 200 when found", async () => {
      const row = { id: "f-1", name: "X" };
      getFeatureMock.mockResolvedValue(row);
      const { GET } = await import("@/app/api/features/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "f-1" })
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(row);
    });
  });

  describe("PATCH", () => {
    it("returns 400 when body is empty object", async () => {
      getFeatureMock.mockResolvedValue({ id: "f-1" });
      const { PATCH } = await import("@/app/api/features/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({}),
        makeParams({ id: "f-1" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 404 when feature missing", async () => {
      updateFeatureCatalogueMock.mockResolvedValue(null);
      const { PATCH } = await import("@/app/api/features/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ description: "New" }),
        makeParams({ id: "f-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 200 on success", async () => {
      const updated = { id: "f-1", name: "X", description: "New" };
      updateFeatureCatalogueMock.mockResolvedValue(updated);
      const { PATCH } = await import("@/app/api/features/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({
          description: "New",
          applicablePaths: ["SLEUTH", "SOLDIER"],
        }),
        makeParams({ id: "f-1" })
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(updated);
      expect(updateFeatureCatalogueMock).toHaveBeenCalledWith(
        "f-1",
        { description: "New", applicablePaths: ["SLEUTH", "SOLDIER"] },
        { officialCatalogueWrite: true }
      );
    });
  });

  describe("DELETE", () => {
    it("returns 404 when feature missing", async () => {
      getFeatureMock.mockResolvedValue(null);
      const { DELETE } = await import("@/app/api/features/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "f-1" })
      );
      expect(response.status).toBe(404);
      expect(deleteFeatureCatalogueMock).not.toHaveBeenCalled();
    });

    it("returns 204 on success", async () => {
      getFeatureMock.mockResolvedValue({ id: "f-1" });
      deleteFeatureCatalogueMock.mockResolvedValue(undefined);
      const { DELETE } = await import("@/app/api/features/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "f-1" })
      );
      expect(response.status).toBe(204);
      expect(deleteFeatureCatalogueMock).toHaveBeenCalledWith("f-1");
    });
  });
});
