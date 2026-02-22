import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeParams } from "../../../helpers";

const characterBelongsToUserMock = vi.fn();
const getCharacterMock = vi.fn();
const updateCharacterMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));
vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: getCharacterMock,
  updateCharacter: updateCharacterMock,
}));
vi.mock("@/app/api/characters/[id]/combat-info/schema", () => ({
  combatInformationUpdateRequestSchema: { safeParse: safeParseMock },
}));

describe("/api/characters/[id]/combat-info PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when request body is invalid", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: undefined,
      error: { issues: [{ message: "invalid combat payload" }] },
    });
    const { PATCH } = await import(
      "@/app/api/characters/[id]/combat-info/route"
    );
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when no combat information exists", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({ data: {}, error: undefined });
    getCharacterMock.mockResolvedValue({ combatInformation: null });
    const { PATCH } = await import(
      "@/app/api/characters/[id]/combat-info/route"
    );
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 200 on successful update", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: { armourCurrentHP: 1 },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      combatInformation: {
        armourCurrentHP: 2,
        armourMod: 1,
        GridMod: 1,
      },
      innateAttributes: {
        dexterity: { agility: 1 },
        strength: { resilience: 1 },
        personality: { mentality: 1 },
      },
      learnedSkills: { generalSkills: { acrobatics: 1, melee: 1, GRID: 1 } },
    });
    updateCharacterMock.mockResolvedValue({ id: "char-1" });
    const { PATCH } = await import(
      "@/app/api/characters/[id]/combat-info/route"
    );
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
  });
});
