import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const userIsSuperAdminMock = vi.fn();
const getAllFeaturesMock = vi.fn();
const createFeatureCatalogueMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/lib/prisma/feature", () => ({
  getAllFeatures: getAllFeaturesMock,
  createFeatureCatalogue: createFeatureCatalogueMock,
}));

describe("/api/features route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/features/route");
    const response = await invokeRoute(GET, makeUnauthedRequest());
    expect(response.status).toBe(401);
  });

  it("GET returns 403 when not super admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/features/route");
    const response = await invokeRoute(GET, makeAuthedRequest());
    expect(response.status).toBe(403);
  });

  it("GET returns 200 with sorted features", async () => {
    getAllFeaturesMock.mockResolvedValue([
      { id: "b", name: "Beta" },
      { id: "a", name: "Alpha" },
    ]);
    const { GET } = await import("@/app/api/features/route");
    const response = await invokeRoute(GET, makeAuthedRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { id: "a", name: "Alpha" },
      { id: "b", name: "Beta" },
    ]);
  });

  it("POST returns 403 when not super admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/features/route");
    const response = await invokeRoute(POST, makeAuthedRequest({ name: "X" }));
    expect(response.status).toBe(403);
    expect(createFeatureCatalogueMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 on invalid body", async () => {
    const { POST } = await import("@/app/api/features/route");
    const response = await invokeRoute(POST, makeAuthedRequest({ name: "" }));
    expect(response.status).toBe(400);
    expect(createFeatureCatalogueMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when create throws duplicate / missing path", async () => {
    createFeatureCatalogueMock.mockRejectedValue(
      new Error('A feature named "Dup" already exists.')
    );
    const { POST } = await import("@/app/api/features/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        name: "Dup",
        description: "D",
        minPathRank: 1,
        maxGrade: 3,
        examples: [],
        applicablePaths: ["SCIENTIST_DOCTOR"],
      })
    );
    expect(response.status).toBe(400);
  });

  it("POST returns 201 on success", async () => {
    const created = {
      id: "f-1",
      name: "Keen Eye",
      description: "Perception boost",
      minPathRank: 1,
      maxGrade: 3,
      examples: [],
      applicablePaths: ["SLEUTH"],
    };
    createFeatureCatalogueMock.mockResolvedValue(created);
    const { POST } = await import("@/app/api/features/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        name: "Keen Eye",
        description: "Perception boost",
        minPathRank: 1,
        maxGrade: 3,
        examples: [],
        applicablePaths: ["SLEUTH"],
      })
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(created);
    expect(createFeatureCatalogueMock).toHaveBeenCalledWith(
      {
        name: "Keen Eye",
        description: "Perception boost",
        minPathRank: 1,
        maxGrade: 3,
        examples: [],
        applicablePaths: ["SLEUTH"],
      },
      { officialCatalogueWrite: true }
    );
  });
});
