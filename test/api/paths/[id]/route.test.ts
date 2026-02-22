import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const getPathMock = vi.fn();

vi.mock("@/app/lib/prisma/path", () => ({
  getPath: getPathMock,
}));

describe("/api/paths/[id] GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
