import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../../helpers";

const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getCustomEnemyMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/customEnemy", () => ({
  getCustomEnemy: getCustomEnemyMock,
}));

const enemyDoc = {
  id: "ce-1",
  gameId: "g-1",
  name: "Warg",
  description: null as string | null,
  imageKey: null as string | null,
  health: 30,
  speed: 8,
  initiativeModifier: 2,
  numberOfReactions: 1,
  defenceMelee: 1,
  defenceRange: 0,
  defenceGrid: 0,
  attackMelee: 2,
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

describe("GET /api/games/[id]/custom-enemies/[customEnemyId]/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import(
      "@/app/api/games/[id]/custom-enemies/[customEnemyId]/export/route"
    );
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "g-1", customEnemyId: "ce-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 when game id or customEnemyId is missing", async () => {
    const { GET } = await import(
      "@/app/api/games/[id]/custom-enemies/[customEnemyId]/export/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "g-1", customEnemyId: "" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when game not found", async () => {
    getGameMock.mockResolvedValue(null);
    const { GET } = await import(
      "@/app/api/games/[id]/custom-enemies/[customEnemyId]/export/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "g-1", customEnemyId: "ce-1" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 403 when user has no access", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    userIsInGameMock.mockResolvedValue(false);
    const { GET } = await import(
      "@/app/api/games/[id]/custom-enemies/[customEnemyId]/export/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "outsider"),
      makeParams({ id: "g-1", customEnemyId: "ce-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 404 when enemy not in game", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    userIsInGameMock.mockResolvedValue(true);
    getCustomEnemyMock.mockResolvedValue({ ...enemyDoc, gameId: "g-2" });
    const { GET } = await import(
      "@/app/api/games/[id]/custom-enemies/[customEnemyId]/export/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1", customEnemyId: "ce-1" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 404 when enemy does not exist", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    userIsInGameMock.mockResolvedValue(true);
    getCustomEnemyMock.mockResolvedValue(null);
    const { GET } = await import(
      "@/app/api/games/[id]/custom-enemies/[customEnemyId]/export/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1", customEnemyId: "missing" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 200 CSV for one enemy", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    userIsInGameMock.mockResolvedValue(true);
    getCustomEnemyMock.mockResolvedValue(enemyDoc);
    const { GET } = await import(
      "@/app/api/games/[id]/custom-enemies/[customEnemyId]/export/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1", customEnemyId: "ce-1" })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("Warg");
    const text = await response.text();
    expect(text.split("\r\n").filter(Boolean).length).toBe(2);
    expect(text).toContain("Warg");
  });

  it("returns 500 when getCustomEnemy throws", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    userIsInGameMock.mockResolvedValue(true);
    getCustomEnemyMock.mockRejectedValue(new Error("timeout"));
    const { GET } = await import(
      "@/app/api/games/[id]/custom-enemies/[customEnemyId]/export/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1", customEnemyId: "ce-1" })
    );
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.message).toBe("Error exporting custom enemy");
  });
});
