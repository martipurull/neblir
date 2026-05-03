import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getCustomEnemiesByGameMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/customEnemy", () => ({
  getCustomEnemiesByGame: getCustomEnemiesByGameMock,
}));

const sampleEnemyRow = {
  name: "Goblin",
  description: "Small",
  imageKey: null as string | null,
  health: 10,
  speed: 4,
  initiativeModifier: 1,
  numberOfReactions: 1,
  defenceMelee: 0,
  defenceRange: 0,
  defenceGrid: 0,
  attackMelee: 0,
  attackRange: 0,
  attackThrow: 0,
  attackGrid: 0,
  immunities: [] as const,
  resistances: [] as const,
  vulnerabilities: [] as const,
  notes: null as string | null,
  actions: [] as const,
  additionalActions: [] as const,
};

describe("GET /api/games/[id]/custom-enemies/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import(
      "@/app/api/games/[id]/custom-enemies/export/route"
    );
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 when game id is empty", async () => {
    const { GET } = await import(
      "@/app/api/games/[id]/custom-enemies/export/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when game not found", async () => {
    getGameMock.mockResolvedValue(null);
    const { GET } = await import(
      "@/app/api/games/[id]/custom-enemies/export/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 403 when user has no access", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1", name: "A" });
    userIsInGameMock.mockResolvedValue(false);
    const { GET } = await import(
      "@/app/api/games/[id]/custom-enemies/export/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "outsider"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 200 CSV with headers for accessible user", async () => {
    getGameMock.mockResolvedValue({
      id: "g-1",
      gameMaster: "gm-1",
      name: "My Campaign",
    });
    userIsInGameMock.mockResolvedValue(true);
    getCustomEnemiesByGameMock.mockResolvedValue([
      { id: "ce-1", gameId: "g-1", ...sampleEnemyRow },
    ]);
    const { GET } = await import(
      "@/app/api/games/[id]/custom-enemies/export/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "player-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    const cd = response.headers.get("Content-Disposition");
    expect(cd).toContain("attachment");
    expect(cd).toContain("custom-enemies-");
    const text = await response.text();
    expect(text).toContain("name,");
    expect(text).toContain("Goblin");
  });

  it("returns 500 when getCustomEnemiesByGame throws", async () => {
    getGameMock.mockResolvedValue({
      id: "g-1",
      gameMaster: "gm-1",
      name: "A",
    });
    userIsInGameMock.mockResolvedValue(true);
    getCustomEnemiesByGameMock.mockRejectedValue(new Error("db"));
    const { GET } = await import(
      "@/app/api/games/[id]/custom-enemies/export/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "player-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.message).toBe("Error exporting custom enemies");
  });
});
