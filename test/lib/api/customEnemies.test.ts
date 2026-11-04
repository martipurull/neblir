import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCustomEnemy,
  importCustomEnemiesFile,
} from "@/lib/api/customEnemies";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("importCustomEnemiesFile", () => {
  it("returns the parsed import result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          created: 2,
          skipped: 1,
          rowErrors: [{ line: 4, message: "Name is required" }],
        })
      )
    );

    const file = new File(["name\n"], "enemies.csv", { type: "text/csv" });
    await expect(importCustomEnemiesFile("game-1", file)).resolves.toEqual({
      created: 2,
      skipped: 1,
      rowErrors: [{ line: 4, message: "Name is required" }],
    });
  });

  it("throws when the result is missing how many were created", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          skipped: 1,
          rowErrors: [],
        })
      )
    );

    const file = new File(["name\n"], "enemies.csv", { type: "text/csv" });
    await expect(importCustomEnemiesFile("game-1", file)).rejects.toThrow(
      /created/
    );
  });
});

describe("getCustomEnemy", () => {
  it("returns the parsed enemy and omits the game id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          id: "enemy-1",
          gameId: "game-1",
          name: "Warden",
          description: "A guard",
          imageKey: "enemies/warden.png",
          health: 12,
          speed: 5,
          initiativeModifier: 1,
          numberOfReactions: 1,
          defenceMelee: 2,
          defenceRange: 0,
          defenceGrid: 0,
          attackMelee: 3,
          attackRange: 0,
          attackThrow: 0,
          attackGrid: 0,
          immunities: [],
          resistances: ["FIRE"],
          vulnerabilities: [],
          actions: [
            {
              name: "Strike",
              description: "Hits once",
              numberOfDiceToHit: 2,
              numberOfDamageDice: 1,
              damageDiceType: 8,
              damageType: "BLADE",
              notes: "Close",
            },
          ],
          additionalActions: [],
          notes: "Watch the door",
        })
      )
    );

    await expect(getCustomEnemy("game-1", "enemy-1")).resolves.toEqual({
      id: "enemy-1",
      name: "Warden",
      description: "A guard",
      imageKey: "enemies/warden.png",
      health: 12,
      speed: 5,
      initiativeModifier: 1,
      numberOfReactions: 1,
      defenceMelee: 2,
      defenceRange: 0,
      defenceGrid: 0,
      attackMelee: 3,
      attackRange: 0,
      attackThrow: 0,
      attackGrid: 0,
      immunities: [],
      resistances: ["FIRE"],
      vulnerabilities: [],
      actions: [
        {
          name: "Strike",
          description: "Hits once",
          numberOfDiceToHit: 2,
          numberOfDamageDice: 1,
          damageDiceType: 8,
          damageType: "BLADE",
          notes: "Close",
        },
      ],
      additionalActions: [],
      notes: "Watch the door",
    });
  });

  it("throws when the enemy is missing its name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          id: "enemy-1",
          health: 10,
          speed: 6,
          initiativeModifier: 1,
          numberOfReactions: 1,
        })
      )
    );

    await expect(getCustomEnemy("game-1", "enemy-1")).rejects.toThrow(/name/);
  });
});
