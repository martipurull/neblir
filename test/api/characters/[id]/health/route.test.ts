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
vi.mock("@/app/api/characters/[id]/health/schema", () => ({
  healthUpdateSchema: { safeParse: safeParseMock },
}));

describe("/api/characters/[id]/health PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when parsed current physical health exceeds max", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: { currentPhysicalHealth: 99 },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      health: { maxPhysicalHealth: 10, maxMentalHealth: 10 },
    });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    const response = await invokeRoute(PATCH, makeAuthedRequest({}), makeParams({ id: "char-1" }));
    expect(response.status).toBe(400);
  });

  it("returns 404 when character does not exist", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({ data: {}, error: undefined });
    getCharacterMock.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    const response = await invokeRoute(PATCH, makeAuthedRequest({}), makeParams({ id: "char-1" }));
    expect(response.status).toBe(404);
  });

  it("returns 200 on success", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({ data: { status: "ALIVE" }, error: undefined });
    getCharacterMock.mockResolvedValue({
      health: { maxPhysicalHealth: 10, maxMentalHealth: 10, status: "ALIVE" },
    });
    updateCharacterMock.mockResolvedValue({ id: "char-1" });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    const response = await invokeRoute(PATCH, makeAuthedRequest({}), makeParams({ id: "char-1" }));
    expect(response.status).toBe(200);
  });
});
