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
const getFeaturesMock = vi.fn();
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
  getFeatures: getFeaturesMock,
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

const CATALOGUE_PATHS: Record<string, { id: string; name: string }> = {
  "path-soldier": { id: "path-soldier", name: "SOLDIER" },
  "path-medic": { id: "path-medic", name: "SCIENTIST_DOCTOR" },
  "path-techno": { id: "path-techno", name: "TECHNO_CRAFTER" },
};

function makeUpdateBody(
  extras: {
    level?: number;
    paths?: Array<{ pathId: string; rank: number }>;
    initialFeatures?: Array<{ featureId: string; grade: number }>;
  } = {}
) {
  return {
    generalInformation: {
      name: "Ada",
      surname: "Lovelace",
      age: 25,
      religion: "ATHEIST",
      profession: "Engineer",
      race: "HUMAN",
      birthplace: "London",
      level: extras.level ?? 3,
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
    paths: extras.paths ?? [
      { pathId: "path-soldier", rank: 2 },
      { pathId: "path-medic", rank: 1 },
    ],
    initialFeatures: extras.initialFeatures ?? [],
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
    getPathMock.mockImplementation(
      async (id: string) => CATALOGUE_PATHS[id] ?? null
    );
    getFeaturesMock.mockResolvedValue([]);
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
          name: "SCIENTIST_DOCTOR",
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

  it("updates existing path ranks in place without deleting remaining paths", async () => {
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        makeUpdateBody({
          paths: [
            { pathId: "path-soldier", rank: 1 },
            { pathId: "path-medic", rank: 2 },
          ],
        })
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(pathCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "pc-soldier" },
      data: { rank: 1 },
    });
    expect(pathCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "pc-medic" },
      data: { rank: 2 },
    });
    expect(pathCharacterUpdateMock.mock.calls[0][0].data).not.toHaveProperty(
      "favouriteWeapon"
    );
    expect(pathCharacterDeleteMock).not.toHaveBeenCalled();
    expect(pathCharacterCreateMock).not.toHaveBeenCalled();
    expect(pathCharacterDeleteManyMock).not.toHaveBeenCalled();
  });

  it("full-replaces the path set by adding, removing, and keeping rows", async () => {
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        makeUpdateBody({
          paths: [
            { pathId: "path-soldier", rank: 2 },
            { pathId: "path-techno", rank: 1 },
          ],
        })
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(pathCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "pc-soldier" },
      data: { rank: 2 },
    });
    expect(pathCharacterCreateMock).toHaveBeenCalledWith({
      data: {
        characterId: "char-1",
        pathId: "path-techno",
        rank: 1,
      },
    });
    expect(pathCharacterDeleteMock).toHaveBeenCalledWith({
      where: { id: "pc-medic" },
    });
    expect(pathCharacterDeleteMock).not.toHaveBeenCalledWith({
      where: { id: "pc-soldier" },
    });
  });

  it("keeps the Soldier favourite weapon when Soldier remains after save", async () => {
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        makeUpdateBody({
          paths: [
            { pathId: "path-soldier", rank: 2 },
            { pathId: "path-techno", rank: 1 },
          ],
        })
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(pathCharacterDeleteMock).not.toHaveBeenCalledWith({
      where: { id: "pc-soldier" },
    });
    expect(pathCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "pc-soldier" },
      data: { rank: 2 },
    });
    expect(pathCharacterUpdateMock.mock.calls[0][0].data).not.toHaveProperty(
      "favouriteWeapon"
    );
  });

  it("clears the favourite weapon by removing the Soldier path row", async () => {
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        makeUpdateBody({
          paths: [{ pathId: "path-medic", rank: 3 }],
        })
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(pathCharacterDeleteMock).toHaveBeenCalledWith({
      where: { id: "pc-soldier" },
    });
    expect(pathCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "pc-medic" },
      data: { rank: 3 },
    });
  });

  it("rejects unallocated level greater than 0", async () => {
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        makeUpdateBody({
          level: 4,
          paths: [
            { pathId: "path-soldier", rank: 2 },
            { pathId: "path-medic", rank: 1 },
          ],
        })
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe(
      "Unallocated level is 1. Assign all level to path ranks before saving."
    );
    expect(characterUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects path ranks that exceed level", async () => {
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        makeUpdateBody({
          level: 2,
          paths: [
            { pathId: "path-soldier", rank: 2 },
            { pathId: "path-medic", rank: 1 },
          ],
        })
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe(
      "Path ranks exceed level by 1. Reduce ranks or raise level before saving."
    );
    expect(characterUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects duplicate path ids", async () => {
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        makeUpdateBody({
          paths: [
            { pathId: "path-soldier", rank: 2 },
            { pathId: "path-soldier", rank: 1 },
          ],
        })
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe("Duplicate paths are not allowed");
    expect(characterUpdateMock).not.toHaveBeenCalled();
  });

  it("replaces owned features when they fit the level grade budget and are legal", async () => {
    getFeaturesMock.mockResolvedValue([
      {
        id: "feat-cover",
        name: "Cover fire",
        maxGrade: 3,
        minPathRank: 1,
        applicablePaths: ["SOLDIER"],
      },
    ]);
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        makeUpdateBody({
          initialFeatures: [{ featureId: "feat-cover", grade: 2 }],
        })
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(featureCharacterDeleteManyMock).toHaveBeenCalledWith({
      where: { characterId: "char-1" },
    });
    expect(featureCharacterCreateManyMock).toHaveBeenCalledWith({
      data: [
        {
          characterId: "char-1",
          featureId: "feat-cover",
          grade: 2,
        },
      ],
    });
  });

  it("rejects feature grades that exceed 2 × (level − 1)", async () => {
    getFeaturesMock.mockResolvedValue([
      {
        id: "feat-cover",
        name: "Cover fire",
        maxGrade: 6,
        minPathRank: 1,
        applicablePaths: ["SOLDIER"],
      },
    ]);
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        makeUpdateBody({
          initialFeatures: [{ featureId: "feat-cover", grade: 5 }],
        })
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe(
      "Total feature grades cannot exceed character feature grade slots"
    );
    expect(characterUpdateMock).not.toHaveBeenCalled();
  });

  it("accepts a feature that is legal for a secondary submitted path", async () => {
    getFeaturesMock.mockResolvedValue([
      {
        id: "feat-heal",
        name: "Field medicine",
        maxGrade: 2,
        minPathRank: 1,
        applicablePaths: ["SCIENTIST_DOCTOR"],
      },
    ]);
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        makeUpdateBody({
          initialFeatures: [{ featureId: "feat-heal", grade: 1 }],
        })
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
  });

  it("rejects a feature that is not legal for any submitted path and rank", async () => {
    getFeaturesMock.mockResolvedValue([
      {
        id: "feat-heal",
        name: "Field medicine",
        maxGrade: 2,
        minPathRank: 2,
        applicablePaths: ["SCIENTIST_DOCTOR"],
      },
    ]);
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        makeUpdateBody({
          paths: [{ pathId: "path-soldier", rank: 3 }],
          initialFeatures: [{ featureId: "feat-heal", grade: 1 }],
        })
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe(
      "Feature Field medicine is not legal for the submitted paths and ranks"
    );
    expect(characterUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects an empty paths array", async () => {
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(makeUpdateBody({ paths: [] })),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    expect(characterUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects a path rank below 1", async () => {
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        makeUpdateBody({
          paths: [{ pathId: "path-soldier", rank: 0 }],
        })
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    expect(characterUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects a path that is not in the catalogue", async () => {
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        makeUpdateBody({
          paths: [{ pathId: "path-missing", rank: 3 }],
        })
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe("Path not found");
    expect(characterUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects retired primary-path body fields", async () => {
    const { PATCH } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({
        ...makeUpdateBody(),
        path: { pathId: "path-soldier", rank: 3 },
        primaryPathCharacterId: "pc-soldier",
      }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    expect(characterUpdateMock).not.toHaveBeenCalled();
  });
});
