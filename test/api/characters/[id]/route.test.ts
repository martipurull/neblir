import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";
import { CharacterDeletionTransactionError } from "@/app/api/shared/errors";

const getCharacterMock = vi.fn();
const deleteCharacterMock = vi.fn();
const characterBelongsToUserMock = vi.fn();
const getPathMock = vi.fn();
const getAllFeaturesAvailableForPathAndRankMock = vi.fn();
const pathCharacterUpdateMock = vi.fn();
const pathCharacterDeleteMock = vi.fn();
const pathCharacterCreateMock = vi.fn();
const pathCharacterDeleteManyMock = vi.fn();
const characterCurrencyDeleteManyMock = vi.fn();
const characterCurrencyCreateManyMock = vi.fn();
const featureCharacterDeleteManyMock = vi.fn();
const featureCharacterCreateManyMock = vi.fn();
const characterUpdateMock = vi.fn();

vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: getCharacterMock,
  deleteCharacter: deleteCharacterMock,
}));

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));

vi.mock("@/app/lib/prisma/path", () => ({
  getPath: getPathMock,
}));

vi.mock("@/app/lib/prisma/feature", () => ({
  getAllFeaturesAvailableForPathAndRank:
    getAllFeaturesAvailableForPathAndRankMock,
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        characterCurrency: {
          deleteMany: characterCurrencyDeleteManyMock,
          createMany: characterCurrencyCreateManyMock,
        },
        pathCharacter: {
          update: pathCharacterUpdateMock,
          delete: pathCharacterDeleteMock,
          create: pathCharacterCreateMock,
          deleteMany: pathCharacterDeleteManyMock,
        },
        featureCharacter: {
          deleteMany: featureCharacterDeleteManyMock,
          createMany: featureCharacterCreateManyMock,
        },
        character: {
          update: characterUpdateMock,
        },
      }),
  },
}));

describe("/api/characters/[id] handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
  });

  it("GET returns 403 when character is not owned", async () => {
    characterBelongsToUserMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
  });

  it("GET returns 404 when character does not exist", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(404);
  });

  it("GET returns 200 with character (paths normalized by getCharacter)", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      generalInformation: { name: "Nova", surname: "Voss", level: 1 },
      health: {},
      combatInformation: {},
      innateAttributes: {},
      learnedSkills: { generalSkills: {}, specialSkills: [] },
      wallet: [],
      inventory: [],
      notes: [],
      paths: [
        {
          id: "path-1",
          name: "MEDIC",
          description: null,
          baseFeature: "feat-1",
        },
      ],
      features: [],
    });
    const { GET } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.paths).toEqual([
      { id: "path-1", name: "MEDIC", description: null, baseFeature: "feat-1" },
    ]);
  });

  it("DELETE returns 500 on CharacterDeletionTransactionError", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    deleteCharacterMock.mockRejectedValue(
      new CharacterDeletionTransactionError("deleteCharacter")
    );
    const { DELETE } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(500);
  });

  it("DELETE returns 204 on success", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    deleteCharacterMock.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(204);
  });
});

const baseAttributes = {
  intelligence: { investigation: 2, memory: 2, deduction: 2 },
  wisdom: { sense: 2, perception: 2, insight: 2 },
  personality: { persuasion: 2, deception: 2, mentality: 2 },
  strength: { athletics: 2, resilience: 2, bruteForce: 2 },
  dexterity: { manual: 2, stealth: 2, agility: 2 },
  constitution: { resistanceInternal: 2, resistanceExternal: 2, stamina: 2 },
};

const baseGeneralSkills = {
  mechanics: 0,
  software: 0,
  generalKnowledge: 0,
  history: 0,
  driving: 0,
  acrobatics: 0,
  aim: 0,
  melee: 0,
  GRID: 0,
  research: 0,
  medicine: 0,
  science: 0,
  survival: 0,
  streetwise: 0,
  performance: 0,
  manipulationNegotiation: 0,
};

function makeUpdateBody(pathId = "path-soldier") {
  return {
    generalInformation: {
      name: "Ada",
      surname: "Lovelace",
      age: 25,
      religion: "ATHEIST",
      profession: "Engineer",
      race: "HUMAN",
      birthplace: "London",
      level: 1,
      height: 170,
      weight: 70,
    },
    health: {
      rolledPhysicalHealth: 10,
      rolledMentalHealth: 10,
      seriousPhysicalInjuries: 0,
      seriousTrauma: 0,
      status: "ALIVE",
    },
    combatInformation: {
      armourMod: 0,
      armourMaxHP: 0,
      armourCurrentHP: 0,
      throwAttackMod: 0,
    },
    innateAttributes: baseAttributes,
    learnedSkills: {
      generalSkills: baseGeneralSkills,
      specialSkills: [],
    },
    wallet: [],
    path: { pathId, rank: 2 },
    initialFeatures: [],
  };
}

function makeExistingCharacter(
  paths: Array<{
    id: string;
    name: string;
    rank: number;
    pathCharacterId: string;
    favouriteWeaponItemId?: string | null;
  }>
) {
  return {
    id: "char-1",
    health: {
      currentPhysicalHealth: 4,
      currentMentalHealth: 5,
      maxPhysicalHealth: 16,
      maxMentalHealth: 16,
      deathSaves: { successes: 2, failures: 1 },
      madnessSaves: { successes: 0, failures: 2 },
      status: "ALIVE",
    },
    combatInformation: { reactionsRemaining: 1 },
    paths,
    features: [],
  };
}

describe("/api/characters/[id] PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    characterBelongsToUserMock.mockResolvedValue(true);
    getPathMock.mockResolvedValue({ id: "path-soldier", name: "SOLDIER" });
    getAllFeaturesAvailableForPathAndRankMock.mockResolvedValue([]);
    getCharacterMock.mockResolvedValue(
      makeExistingCharacter([
        {
          id: "path-soldier",
          name: "SOLDIER",
          rank: 2,
          pathCharacterId: "pc-soldier",
          favouriteWeaponItemId: "weapon-1",
        },
        {
          id: "path-medic",
          name: "MEDIC",
          rank: 1,
          pathCharacterId: "pc-medic",
        },
      ])
    );
  });

  it("keeps current HP, crisis tracks, and reactions instead of full-healing", async () => {
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(makeUpdateBody()),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(characterUpdateMock).toHaveBeenCalled();
    const updateData = characterUpdateMock.mock.calls[0][0].data;
    expect(updateData.health).toMatchObject({
      currentPhysicalHealth: 4,
      currentMentalHealth: 5,
      deathSaves: { successes: 2, failures: 1 },
      madnessSaves: { successes: 0, failures: 2 },
    });
    expect(updateData.combatInformation.reactionsRemaining).toBe(1);
  });

  it("updates an existing path in place and does not delete other paths", async () => {
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(makeUpdateBody("path-soldier")),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(pathCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "pc-soldier" },
      data: { rank: 2 },
    });
    expect(pathCharacterUpdateMock.mock.calls[0][0].data).not.toHaveProperty(
      "favouriteWeapon"
    );
    expect(pathCharacterDeleteMock).not.toHaveBeenCalled();
    expect(pathCharacterCreateMock).not.toHaveBeenCalled();
    expect(pathCharacterDeleteManyMock).not.toHaveBeenCalled();
  });

  it("replaces only the previous primary path when the form path is new", async () => {
    getPathMock.mockResolvedValue({
      id: "path-techno",
      name: "TECHNO_CRAFTER",
    });
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(makeUpdateBody("path-techno")),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(pathCharacterDeleteMock).toHaveBeenCalledWith({
      where: { id: "pc-soldier" },
    });
    expect(pathCharacterCreateMock).toHaveBeenCalledWith({
      data: {
        characterId: "char-1",
        pathId: "path-techno",
        rank: 2,
      },
    });
    expect(pathCharacterDeleteManyMock).not.toHaveBeenCalled();
    expect(pathCharacterUpdateMock).not.toHaveBeenCalled();
  });
});
