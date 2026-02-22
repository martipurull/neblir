import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getPathMock = vi.fn();
const getAllFeaturesAvailableForPathMock = vi.fn();

vi.mock("@/app/lib/prisma/path", () => ({
  getPath: getPathMock,
}));

vi.mock("@/app/lib/prisma/feature", () => ({
  getAllFeaturesAvailableForPath: getAllFeaturesAvailableForPathMock,
}));

describe("/api/paths/[id]/available-features GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import(
      "@/app/api/paths/[id]/available-features/route"
    );
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "p-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when path does not exist", async () => {
    getPathMock.mockResolvedValue(null);
    const { GET } = await import(
      "@/app/api/paths/[id]/available-features/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "p-1" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 200 with available features", async () => {
    getPathMock.mockResolvedValue({ id: "p-1", name: "Scholar" });
    getAllFeaturesAvailableForPathMock.mockResolvedValue([{ id: "f-1" }]);
    const { GET } = await import(
      "@/app/api/paths/[id]/available-features/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "p-1" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ id: "f-1" }]);
  });
});
