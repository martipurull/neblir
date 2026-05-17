import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const createPathMock = vi.fn();
const getPathsMock = vi.fn();
const findPathByNameMock = vi.fn();
const safeParseMock = vi.fn();
const userIsSuperAdminMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/lib/prisma/path", () => ({
  createPath: createPathMock,
  getPaths: getPathsMock,
  findPathByName: findPathByNameMock,
}));

vi.mock("@/app/lib/types/path", () => ({
  pathSchema: { safeParse: safeParseMock },
  pathCreateSchema: { safeParse: safeParseMock },
}));

describe("/api/paths handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
  });

  it("POST returns 401 for unauthenticated users", async () => {
    const { POST } = await import("@/app/api/paths/route");
    const response = await invokeRoute(POST, makeUnauthedRequest());
    expect(response.status).toBe(401);
  });

  it("POST returns 400 on invalid payload", async () => {
    safeParseMock.mockReturnValue({
      data: undefined,
      error: { issues: [{ message: "invalid path payload" }] },
    });
    const { POST } = await import("@/app/api/paths/route");
    const response = await invokeRoute(POST, makeAuthedRequest({ bad: true }));
    expect(response.status).toBe(400);
  });

  it("POST returns 409 when path name already exists", async () => {
    safeParseMock.mockReturnValue({
      data: { name: "SLEUTH", baseFeature: "x" },
      error: undefined,
    });
    findPathByNameMock.mockResolvedValue({ id: "existing", name: "SLEUTH" });
    const { POST } = await import("@/app/api/paths/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ name: "SLEUTH", baseFeature: "x" })
    );
    expect(response.status).toBe(409);
    expect(createPathMock).not.toHaveBeenCalled();
  });

  it("POST returns 201 on success", async () => {
    safeParseMock.mockReturnValue({
      data: { name: "Alchemist" },
      error: undefined,
    });
    findPathByNameMock.mockResolvedValue(null);
    createPathMock.mockResolvedValue({ id: "p-1", name: "Alchemist" });
    const { POST } = await import("@/app/api/paths/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ name: "Alchemist" })
    );
    expect(response.status).toBe(201);
  });

  it("GET returns 200 with paths", async () => {
    getPathsMock.mockResolvedValue([{ id: "p-1" }]);
    const { GET } = await import("@/app/api/paths/route");
    const response = await invokeRoute(GET, makeAuthedRequest());
    expect(response.status).toBe(200);
  });
});
