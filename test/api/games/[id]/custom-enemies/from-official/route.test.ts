import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();
const getEnemyMock = vi.fn();
const createCustomEnemyMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/enemy", () => ({
  getEnemy: getEnemyMock,
}));

vi.mock("@/app/lib/prisma/customEnemy", () => ({
  createCustomEnemy: createCustomEnemyMock,
}));

const enemy = {
  id: "e-1",
  name: "Official Goblin",
  description: null as string | null,
  imageKey: null as string | null,
  health: 8,
  speed: 5,
  initiativeModifier: 1,
  numberOfReactions: 1,
  defenceMelee: 0,
  defenceRange: 0,
  defenceGrid: 0,
  attackMelee: 0,
  attackRange: 0,
  attackThrow: 0,
  attackGrid: 0,
  immunities: [] as string[],
  resistances: [] as string[],
  vulnerabilities: [] as string[],
  actions: [] as unknown[],
  additionalActions: [] as unknown[],
  notes: null as string | null,
};

describe("POST /api/games/[id]/custom-enemies/from-official", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/from-official/route"
    );
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({ enemyId: "e-1" }),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when caller is not game master", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/from-official/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ enemyId: "e-1" }, "player-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 404 when enemy does not exist", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    getEnemyMock.mockResolvedValue(null);
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/from-official/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ enemyId: "missing" }, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
  });

  it("creates custom enemy from official enemy on success", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    getEnemyMock.mockResolvedValue(enemy);
    createCustomEnemyMock.mockResolvedValue({ id: "ce-1", gameId: "g-1" });
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/from-official/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ enemyId: "e-1" }, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(createCustomEnemyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: "g-1",
        name: "Official Goblin",
        numberOfReactions: 1,
      })
    );
  });
});
