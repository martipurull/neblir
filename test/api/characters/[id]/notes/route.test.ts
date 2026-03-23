import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeParams } from "../../../helpers";

const characterBelongsToUserMock = vi.fn();
const updateCharacterMock = vi.fn();
const getCharacterMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));
vi.mock("@/app/lib/prisma/character", () => ({
  updateCharacter: updateCharacterMock,
  getCharacter: getCharacterMock,
}));
vi.mock("@/app/lib/types/character", () => ({
  characterNotesSchema: { safeParse: safeParseMock },
}));

describe("/api/characters/[id]/notes PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 on invalid notes body", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: undefined,
      error: { issues: [{ message: "invalid notes" }] },
    });
    const { PATCH } = await import("@/app/api/characters/[id]/notes/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 200 on success", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: [
        {
          content: '{"type":"doc","content":[]}',
          createdAt: "2020-01-01T00:00:00.000Z",
          updatedAt: "2020-01-01T00:00:00.000Z",
        },
      ],
      error: undefined,
    });
    updateCharacterMock.mockResolvedValue({ id: "char-1" });
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      generalInformation: { name: "N", surname: "V", level: 1 },
      health: {},
      combatInformation: {},
      innateAttributes: {},
      learnedSkills: { generalSkills: {}, specialSkills: [] },
      wallet: [],
      inventory: [],
      notes: [],
      paths: [],
      features: [],
    });
    const { PATCH } = await import("@/app/api/characters/[id]/notes/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
  });
});
