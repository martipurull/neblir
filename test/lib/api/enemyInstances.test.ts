import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnemyInstance } from "@/lib/api/enemyInstances";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const enemyInstanceBody = {
  id: "inst-1",
  gameId: "game-1",
  name: "Raider",
  instanceLabel: "Raider",
  currentHealth: 8,
  maxHealth: 10,
  reactionsRemaining: 1,
  reactionsPerRound: 1,
  status: "ACTIVE",
  speed: 6,
  initiativeModifier: 2,
  defenceMelee: 1,
  defenceRange: 0,
  defenceGrid: 0,
  attackMelee: 2,
  attackRange: 0,
  attackThrow: 0,
  attackGrid: 0,
  immunities: [],
  resistances: ["FIRE"],
  vulnerabilities: [],
  actions: [],
  additionalActions: [],
  createdAt: "2026-04-01T00:00:00.000Z",
};

describe("getEnemyInstance", () => {
  it("returns the parsed enemy instance and omits timestamps", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(enemyInstanceBody))
    );

    const { createdAt: _createdAt, ...parsed } = enemyInstanceBody;
    await expect(getEnemyInstance("game-1", "inst-1")).resolves.toEqual(parsed);
  });

  it("throws when the instance is missing its name", async () => {
    const { name: _name, ...withoutName } = enemyInstanceBody;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(withoutName))
    );

    await expect(getEnemyInstance("game-1", "inst-1")).rejects.toThrow(/name/);
  });
});
