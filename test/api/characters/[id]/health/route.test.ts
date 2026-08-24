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
      health: {
        maxPhysicalHealth: 10,
        maxMentalHealth: 10,
        currentPhysicalHealth: 8,
        currentMentalHealth: 8,
        seriousPhysicalInjuries: 0,
        seriousTrauma: 0,
        deathSaves: { successes: 0, failures: 0 },
        status: "ALIVE",
      },
    });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when character does not exist", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({ data: {}, error: undefined });
    getCharacterMock.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 200 on success", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: { status: "ALIVE" },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      health: {
        maxPhysicalHealth: 10,
        maxMentalHealth: 10,
        currentPhysicalHealth: 8,
        currentMentalHealth: 8,
        seriousPhysicalInjuries: 0,
        seriousTrauma: 0,
        deathSaves: { successes: 0, failures: 0 },
        status: "ALIVE",
      },
    });
    updateCharacterMock.mockResolvedValue({ id: "char-1" });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
  });

  it("persists DECEASED when death-roll failures reach 3", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: { deathSaves: { successes: 0, failures: 3 } },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      health: {
        maxPhysicalHealth: 10,
        maxMentalHealth: 10,
        currentPhysicalHealth: 0,
        currentMentalHealth: 8,
        seriousPhysicalInjuries: 0,
        seriousTrauma: 0,
        deathSaves: { successes: 1, failures: 2 },
        madnessSaves: { successes: 0, failures: 0 },
        status: "ALIVE",
      },
    });
    updateCharacterMock.mockResolvedValue({ id: "char-1" });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(updateCharacterMock).toHaveBeenCalledWith("char-1", {
      health: expect.objectContaining({
        status: "DECEASED",
        deathSaves: { successes: 0, failures: 3 },
      }),
    });
  });

  it("persists DERANGED when madness-roll failures reach 3", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: { madnessSaves: { successes: 0, failures: 3 } },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      health: {
        maxPhysicalHealth: 10,
        maxMentalHealth: 10,
        currentPhysicalHealth: 8,
        currentMentalHealth: 0,
        seriousPhysicalInjuries: 0,
        seriousTrauma: 0,
        deathSaves: { successes: 0, failures: 0 },
        madnessSaves: { successes: 1, failures: 2 },
        status: "ALIVE",
      },
    });
    updateCharacterMock.mockResolvedValue({ id: "char-1" });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(updateCharacterMock).toHaveBeenCalledWith("char-1", {
      health: expect.objectContaining({
        status: "DERANGED",
        madnessSaves: { successes: 0, failures: 3 },
      }),
    });
  });

  it("returns 400 when death-roll boxes are edited while deceased", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: { deathSaves: { successes: 0, failures: 2 } },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      health: {
        maxPhysicalHealth: 10,
        maxMentalHealth: 10,
        currentPhysicalHealth: 0,
        currentMentalHealth: 8,
        seriousPhysicalInjuries: 0,
        seriousTrauma: 0,
        deathSaves: { successes: 0, failures: 3 },
        madnessSaves: { successes: 0, failures: 0 },
        status: "DECEASED",
      },
    });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    expect(updateCharacterMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a physical hit at 0 while stable", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: { physicalHitsAtZero: 1 },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      health: {
        maxPhysicalHealth: 10,
        maxMentalHealth: 10,
        currentPhysicalHealth: 0,
        currentMentalHealth: 8,
        seriousPhysicalInjuries: 0,
        seriousTrauma: 0,
        deathSaves: { successes: 3, failures: 0 },
        madnessSaves: { successes: 0, failures: 0 },
        status: "ALIVE",
      },
    });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    expect(updateCharacterMock).not.toHaveBeenCalled();
  });
});
