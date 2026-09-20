import { beforeEach, describe, expect, it, vi } from "vitest";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import {
  clearCatalogueR2,
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
  setCatalogueR2,
} from "../../helpers";

const userIsSuperAdminMock = vi.fn();
const getEnemyMock = vi.fn();
const getEnemiesMock = vi.fn();
const updateEnemyMock = vi.fn();
const deleteOfficialEnemyMock = vi.fn();
const countOfficialRowsWithCatalogueImageKeyMock = vi.fn();
const s3SendMock = vi.fn();
const deleteObjectCommandCtorMock = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(function () {
    return {
      send: s3SendMock,
    };
  }),
  DeleteObjectCommand: vi.fn().mockImplementation(function (args: unknown) {
    deleteObjectCommandCtorMock(args);
    return args;
  }),
}));

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/lib/prisma/enemy", () => ({
  getEnemy: getEnemyMock,
  getEnemies: getEnemiesMock,
  updateEnemy: updateEnemyMock,
  deleteOfficialEnemy: deleteOfficialEnemyMock,
}));

vi.mock("@/app/lib/prisma/officialCatalogueImage", () => ({
  countOfficialRowsWithCatalogueImageKey:
    countOfficialRowsWithCatalogueImageKeyMock,
}));

describe("/api/enemies/[id] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
    countOfficialRowsWithCatalogueImageKeyMock.mockResolvedValue(0);
    s3SendMock.mockResolvedValue({});
    getEnemyMock.mockResolvedValue({
      id: "e-1",
      name: "Bandit",
      imageKey: null,
    });
    deleteOfficialEnemyMock.mockResolvedValue({ id: "e-1" });
    clearCatalogueR2();
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import("@/app/api/enemies/[id]/route");
      const response = await invokeRoute(
        GET,
        makeUnauthedRequest(),
        makeParams({ id: "e-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when not super admin", async () => {
      userIsSuperAdminMock.mockResolvedValue(false);
      const { GET } = await import("@/app/api/enemies/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "e-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 404 when missing", async () => {
      getEnemyMock.mockResolvedValue(null);
      const { GET } = await import("@/app/api/enemies/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "e-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 200 when found", async () => {
      const row = { id: "e-1", name: "Bandit" };
      getEnemyMock.mockResolvedValue(row);
      const { GET } = await import("@/app/api/enemies/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "e-1" })
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(row);
    });
  });

  describe("PATCH", () => {
    it("returns 404 when missing", async () => {
      getEnemyMock.mockResolvedValue(null);
      const { PATCH } = await import("@/app/api/enemies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Bandit II" }),
        makeParams({ id: "e-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 200 when updated", async () => {
      getEnemyMock.mockResolvedValue({ id: "e-1", name: "Bandit" });
      getEnemiesMock.mockResolvedValue([{ id: "e-1", name: "Bandit" }]);
      updateEnemyMock.mockResolvedValue({ id: "e-1", name: "Bandit II" });
      const { PATCH } = await import("@/app/api/enemies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Bandit II" }),
        makeParams({ id: "e-1" })
      );
      expect(response.status).toBe(200);
      expect(updateEnemyMock).toHaveBeenCalled();
    });

    it("returns 409 when the Official name collides with another row", async () => {
      getEnemyMock.mockResolvedValue({ id: "e-1", name: "Bandit" });
      getEnemiesMock.mockResolvedValue([
        { id: "e-1", name: "Bandit" },
        { id: "e-2", name: "Siike Gun" },
      ]);
      const { PATCH } = await import("@/app/api/enemies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "siike gun" }),
        makeParams({ id: "e-1" })
      );
      expect(response.status).toBe(409);
      expect(updateEnemyMock).not.toHaveBeenCalled();
    });

    it("returns 200 when renaming a row to its own Official name", async () => {
      getEnemyMock.mockResolvedValue({ id: "e-1", name: "Siike Gun" });
      getEnemiesMock.mockResolvedValue([{ id: "e-1", name: "Siike Gun" }]);
      updateEnemyMock.mockResolvedValue({ id: "e-1", name: "siike gun" });
      const { PATCH } = await import("@/app/api/enemies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "siike gun" }),
        makeParams({ id: "e-1" })
      );
      expect(response.status).toBe(200);
      expect(updateEnemyMock).toHaveBeenCalled();
    });
  });

  describe("DELETE", () => {
    it("returns 401 when unauthenticated", async () => {
      const { DELETE } = await import("@/app/api/enemies/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeUnauthedRequest(),
        makeParams({ id: "e-1" })
      );
      expect(response.status).toBe(401);
      expect(deleteOfficialEnemyMock).not.toHaveBeenCalled();
    });

    it("returns 403 when not super admin", async () => {
      userIsSuperAdminMock.mockResolvedValue(false);
      const { DELETE } = await import("@/app/api/enemies/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "e-1" })
      );
      expect(response.status).toBe(403);
      expect(deleteOfficialEnemyMock).not.toHaveBeenCalled();
    });

    it("returns 404 when missing", async () => {
      getEnemyMock.mockResolvedValue(null);
      const { DELETE } = await import("@/app/api/enemies/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "e-1" })
      );
      expect(response.status).toBe(404);
      expect(deleteOfficialEnemyMock).not.toHaveBeenCalled();
    });

    it("returns 204, strips Enemy instances, and records enemies drift", async () => {
      const { DELETE } = await import("@/app/api/enemies/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "e-1" })
      );
      expect(response.status).toBe(204);
      expect(deleteOfficialEnemyMock).toHaveBeenCalledWith("e-1");
      expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["enemies"]);
    });

    it("removes an unreferenced catalogue imageKey", async () => {
      setCatalogueR2();
      getEnemyMock.mockResolvedValue({
        id: "e-1",
        name: "Bandit",
        imageKey: "enemies-bandit.png",
      });
      countOfficialRowsWithCatalogueImageKeyMock.mockResolvedValue(0);
      const { DELETE } = await import("@/app/api/enemies/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "e-1" })
      );
      expect(response.status).toBe(204);
      expect(deleteObjectCommandCtorMock).toHaveBeenCalledWith({
        Bucket: "neblir-catalogue",
        Key: "enemies-bandit.png",
      });
      expect(s3SendMock).toHaveBeenCalled();
    });

    it("keeps a catalogue imageKey still used by another Official row", async () => {
      setCatalogueR2();
      getEnemyMock.mockResolvedValue({
        id: "e-1",
        name: "Bandit",
        imageKey: "enemies-bandit.png",
      });
      countOfficialRowsWithCatalogueImageKeyMock.mockResolvedValue(1);
      const { DELETE } = await import("@/app/api/enemies/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "e-1" })
      );
      expect(response.status).toBe(204);
      expect(s3SendMock).not.toHaveBeenCalled();
    });
  });
});
