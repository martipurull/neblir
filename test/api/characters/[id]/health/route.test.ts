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

function baseHealth(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    maxPhysicalHealth: 10,
    maxMentalHealth: 10,
    currentPhysicalHealth: 8,
    currentMentalHealth: 8,
    seriousPhysicalInjuries: 0,
    seriousTrauma: 0,
    deathSaves: { successes: 0, failures: 0 },
    madnessSaves: { successes: 0, failures: 0 },
    status: "ALIVE",
    ...overrides,
  };
}

describe("/api/characters/[id]/health PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    characterBelongsToUserMock.mockResolvedValue(true);
    updateCharacterMock.mockResolvedValue({ id: "char-1" });
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      health: baseHealth(),
    });
  });

  it("returns 400 when parsed current physical health exceeds max", async () => {
    safeParseMock.mockReturnValue({
      data: { currentPhysicalHealth: 99 },
      error: undefined,
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
    safeParseMock.mockReturnValue({
      data: { status: "ALIVE" },
      error: undefined,
    });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
  });

  it("sets status without rewriting death-roll boxes", async () => {
    safeParseMock.mockReturnValue({
      data: { status: "DECEASED" },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      health: baseHealth({
        currentPhysicalHealth: 0,
        deathSaves: { successes: 1, failures: 2 },
      }),
    });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(updateCharacterMock).toHaveBeenCalledWith("char-1", {
      health: expect.objectContaining({
        status: "DECEASED",
        deathSaves: { successes: 1, failures: 2 },
      }),
    });
  });

  it("clears the death-roll track when physical HP rises above 0", async () => {
    safeParseMock.mockReturnValue({
      data: { currentPhysicalHealth: 2 },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      health: baseHealth({
        currentPhysicalHealth: 0,
        deathSaves: { successes: 2, failures: 1 },
      }),
    });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(updateCharacterMock).toHaveBeenCalledWith("char-1", {
      health: expect.objectContaining({
        currentPhysicalHealth: 2,
        deathSaves: { successes: 0, failures: 0 },
      }),
    });
  });

  it("clears the madness-roll track when mental HP rises above 0", async () => {
    safeParseMock.mockReturnValue({
      data: { currentMentalHealth: 3 },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      health: baseHealth({
        currentMentalHealth: 0,
        madnessSaves: { successes: 2, failures: 1 },
      }),
    });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(updateCharacterMock).toHaveBeenCalledWith("char-1", {
      health: expect.objectContaining({
        currentMentalHealth: 3,
        madnessSaves: { successes: 0, failures: 0 },
      }),
    });
  });

  it("marks a death-roll failure for physicalHitsAtZero while in-cycle", async () => {
    safeParseMock.mockReturnValue({
      data: { physicalHitsAtZero: 1 },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      health: baseHealth({
        currentPhysicalHealth: 0,
        deathSaves: { successes: 1, failures: 1 },
      }),
    });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(updateCharacterMock).toHaveBeenCalledWith("char-1", {
      health: expect.objectContaining({
        currentPhysicalHealth: 0,
        deathSaves: { successes: 1, failures: 2 },
      }),
    });
  });

  it("marks a madness-roll failure for mentalHitsAtZero while in-cycle", async () => {
    safeParseMock.mockReturnValue({
      data: { mentalHitsAtZero: 1 },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      health: baseHealth({
        currentMentalHealth: 0,
        madnessSaves: { successes: 0, failures: 1 },
      }),
    });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(updateCharacterMock).toHaveBeenCalledWith("char-1", {
      health: expect.objectContaining({
        currentMentalHealth: 0,
        madnessSaves: { successes: 0, failures: 2 },
      }),
    });
  });

  it("persists DECEASED when death-roll failures reach 3", async () => {
    safeParseMock.mockReturnValue({
      data: { deathSaves: { successes: 0, failures: 3 } },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      health: baseHealth({
        currentPhysicalHealth: 0,
        deathSaves: { successes: 1, failures: 2 },
      }),
    });
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
    safeParseMock.mockReturnValue({
      data: { madnessSaves: { successes: 0, failures: 3 } },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      health: baseHealth({
        currentMentalHealth: 0,
        madnessSaves: { successes: 1, failures: 2 },
      }),
    });
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

  it("treats missing madnessSaves on the stored character as an empty track", async () => {
    safeParseMock.mockReturnValue({
      data: { madnessSaves: { successes: 0, failures: 1 } },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      health: baseHealth({
        currentMentalHealth: 0,
        madnessSaves: undefined,
      }),
    });
    const { PATCH } = await import("@/app/api/characters/[id]/health/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(updateCharacterMock).toHaveBeenCalledWith("char-1", {
      health: expect.objectContaining({
        madnessSaves: { successes: 0, failures: 1 },
      }),
    });
  });

  it("returns 400 when death-roll boxes are edited while deceased", async () => {
    safeParseMock.mockReturnValue({
      data: { deathSaves: { successes: 0, failures: 2 } },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      health: baseHealth({
        currentPhysicalHealth: 0,
        deathSaves: { successes: 0, failures: 3 },
        status: "DECEASED",
      }),
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

  it("returns 400 when madness-roll boxes are edited while deranged", async () => {
    safeParseMock.mockReturnValue({
      data: { madnessSaves: { successes: 1, failures: 2 } },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      health: baseHealth({
        currentMentalHealth: 0,
        madnessSaves: { successes: 0, failures: 3 },
        status: "DERANGED",
      }),
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
    safeParseMock.mockReturnValue({
      data: { physicalHitsAtZero: 1 },
      error: undefined,
    });
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      health: baseHealth({
        currentPhysicalHealth: 0,
        deathSaves: { successes: 3, failures: 0 },
      }),
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
