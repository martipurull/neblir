import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeParams } from "../../../helpers";

const characterBelongsToUserMock = vi.fn();
const getCharacterMock = vi.fn();
const getFeaturesAvailableForPathCharacterMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));
vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: getCharacterMock,
}));
vi.mock("@/app/lib/prisma/feature", () => ({
  getFeaturesAvailableForPathCharacter: getFeaturesAvailableForPathCharacterMock,
}));

describe("/api/characters/[id]/available-features GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when character does not exist", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/characters/[id]/available-features/route");
    const response = await invokeRoute(GET, makeAuthedRequest(), makeParams({ id: "char-1" }));
    expect(response.status).toBe(404);
  });

  it("returns 200 with empty array when character has no paths", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterMock.mockResolvedValue({ paths: [], features: [] });
    const { GET } = await import("@/app/api/characters/[id]/available-features/route");
    const response = await invokeRoute(GET, makeAuthedRequest(), makeParams({ id: "char-1" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
  });

  it("returns 200 with existingIncrementalFeatures/newFeatures", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterMock.mockResolvedValue({
      paths: [{ path: { id: "path-1" }, rank: 1 }],
      features: [{ featureId: "feat-1" }],
    });
    getFeaturesAvailableForPathCharacterMock.mockResolvedValue([
      { id: "feat-1", maxGrade: 3 },
      { id: "feat-2", maxGrade: 1 },
    ]);
    const { GET } = await import("@/app/api/characters/[id]/available-features/route");
    const response = await invokeRoute(GET, makeAuthedRequest(), makeParams({ id: "char-1" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      existingIncrementalFeatures: [{ id: "feat-1", maxGrade: 3 }],
      newFeatures: [{ id: "feat-2", maxGrade: 1 }],
    });
  });
});
