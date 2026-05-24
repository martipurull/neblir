import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const getPathMock = vi.fn();
const updatePathMock = vi.fn();
const userIsSuperAdminMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/lib/prisma/path", () => ({
  getPath: getPathMock,
  updatePath: updatePathMock,
}));

describe("/api/paths/[id] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import("@/app/api/paths/[id]/route");
      const response = await invokeRoute(
        GET,
        makeUnauthedRequest(),
        makeParams({ id: "p-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 for invalid path id", async () => {
      const { GET } = await import("@/app/api/paths/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 200 with path", async () => {
      getPathMock.mockResolvedValue({ id: "p-1", name: "Scholar" });
      const { GET } = await import("@/app/api/paths/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "p-1" })
      );
      expect(response.status).toBe(200);
    });
  });

  describe("PATCH", () => {
    it("returns 401 when unauthenticated", async () => {
      const { PATCH } = await import("@/app/api/paths/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeUnauthedRequest({ baseFeature: "<p>x</p>" }),
        makeParams({ id: "p-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when not super admin", async () => {
      userIsSuperAdminMock.mockResolvedValue(false);
      const { PATCH } = await import("@/app/api/paths/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ baseFeature: "<p>x</p>" }),
        makeParams({ id: "p-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 404 when path missing", async () => {
      getPathMock.mockResolvedValue(null);
      const { PATCH } = await import("@/app/api/paths/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ baseFeature: "<p>x</p>" }),
        makeParams({ id: "p-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 200 when updated", async () => {
      getPathMock.mockResolvedValue({ id: "p-1", name: "Scholar" });
      updatePathMock.mockResolvedValue({
        id: "p-1",
        name: "Scholar",
        baseFeature: "<p>updated</p>",
      });
      const { PATCH } = await import("@/app/api/paths/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ baseFeature: "<p>updated</p>" }),
        makeParams({ id: "p-1" })
      );
      expect(response.status).toBe(200);
      expect(updatePathMock).toHaveBeenCalledWith("p-1", {
        baseFeature: "<p>updated</p>",
        protectedFromOfficialImport: true,
      });
    });
  });
});
