import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeUnauthedRequest } from "../helpers";

const createPathMock = vi.fn();
const getPathsMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/path", () => ({
  createPath: createPathMock,
  getPaths: getPathsMock,
}));

vi.mock("@/app/lib/types/path", () => ({
  pathSchema: { safeParse: safeParseMock },
}));

describe("/api/paths handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("POST returns 201 on success", async () => {
    safeParseMock.mockReturnValue({ data: { name: "Alchemist" }, error: undefined });
    createPathMock.mockResolvedValue({ id: "p-1", name: "Alchemist" });
    const { POST } = await import("@/app/api/paths/route");
    const response = await invokeRoute(POST, makeAuthedRequest({ name: "Alchemist" }));
    expect(response.status).toBe(201);
  });

  it("GET returns 200 with paths", async () => {
    getPathsMock.mockResolvedValue([{ id: "p-1" }]);
    const { GET } = await import("@/app/api/paths/route");
    const response = await invokeRoute(GET, makeAuthedRequest());
    expect(response.status).toBe(200);
  });
});
