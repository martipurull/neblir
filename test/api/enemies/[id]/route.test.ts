import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const userIsSuperAdminMock = vi.fn();
const getEnemyMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/enemy", () => ({
  getEnemy: getEnemyMock,
}));

describe("/api/enemies/[id] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
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
});
