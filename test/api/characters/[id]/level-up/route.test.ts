import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getCharacterMock = vi.fn();
const levelUpCharacterWithRelationsMock = vi.fn();
const characterBelongsToUserMock = vi.fn();
const computeCharacterRequestDataMock = vi.fn();
const safeParseMock = vi.fn();
const parseAttributeChangesMock = vi.fn();
const parseHealthUpdateMock = vi.fn();
const calculateNewReactionsPerRoundMock = vi.fn();
const parseCharacterBodyToComputeMock = vi.fn();
const areFeaturesValidForLevelUpMock = vi.fn();
const areIncrementFeaturesValidMock = vi.fn();

vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: getCharacterMock,
  levelUpCharacterWithRelations: levelUpCharacterWithRelationsMock,
}));

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));

vi.mock("@/app/api/characters/parsing", () => ({
  computeCharacterRequestData: computeCharacterRequestDataMock,
}));

vi.mock("@/app/api/characters/[id]/level-up/schema", () => ({
  levelUpRequestSchema: { safeParse: safeParseMock },
}));

vi.mock("@/app/api/characters/[id]/level-up/parsing", () => ({
  parseAttributeChanges: parseAttributeChangesMock,
  parseHealthUpdate: parseHealthUpdateMock,
  calculateNewReactionsPerRound: calculateNewReactionsPerRoundMock,
  parseCharacterBodyToCompute: parseCharacterBodyToComputeMock,
  areFeaturesValidForLevelUp: areFeaturesValidForLevelUpMock,
  areIncrementFeaturesValid: areIncrementFeaturesValidMock,
}));

describe("/api/characters/[id]/level-up POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/characters/[id]/level-up/route");
    const response = await invokeRoute(POST, makeUnauthedRequest(), makeParams({ id: "char-1" }));
    expect(response.status).toBe(401);
  });

  it("returns 403 when character does not belong to user", async () => {
    characterBelongsToUserMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/characters/[id]/level-up/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({}, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 400 when request body validation fails", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      success: false,
      error: { issues: [{ message: "invalid body" }] },
    });
    const { POST } = await import("@/app/api/characters/[id]/level-up/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ bad: true }, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when character does not exist", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      success: true,
      data: {
        attributeChanges: [],
        healthUpdate: {},
        skillImprovement: {},
        newFeatureIds: [],
        incrementalFeatureIds: [],
        pathId: "path-1",
      },
    });
    getCharacterMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/characters/[id]/level-up/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({}, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 200 when level-up is applied successfully", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      success: true,
      data: {
        attributeChanges: [],
        healthUpdate: {},
        skillImprovement: {},
        newFeatureIds: [],
        incrementalFeatureIds: [],
        pathId: "path-1",
      },
    });
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      generalInformation: { level: 2 },
      paths: [],
      features: [],
    });
    parseAttributeChangesMock.mockReturnValue({});
    parseHealthUpdateMock.mockReturnValue({
      newRolledMentalHealth: 10,
      newRolledPhysicalHealth: 10,
    });
    calculateNewReactionsPerRoundMock.mockResolvedValue(1);
    parseCharacterBodyToComputeMock.mockReturnValue({ updateBody: {} });
    computeCharacterRequestDataMock.mockReturnValue({});
    areFeaturesValidForLevelUpMock.mockResolvedValue(true);
    areIncrementFeaturesValidMock.mockResolvedValue(true);
    levelUpCharacterWithRelationsMock.mockResolvedValue({ id: "char-1" });
    const { POST } = await import("@/app/api/characters/[id]/level-up/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({}, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(levelUpCharacterWithRelationsMock).toHaveBeenCalled();
  });
});
