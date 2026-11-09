import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createUniqueBot,
  mintUniqueBotForCharacter,
  updateUniqueBot,
} from "@/lib/api/uniqueBots";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const record = {
  id: "ub-1",
  ownerUserId: "user-1",
  gameId: "game-1",
  sourceType: "STANDALONE" as const,
  nameOverride: "Mule",
  maxHpOverride: 8,
};

describe("createUniqueBot", () => {
  it("returns the created id from a well-formed body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ id: "ub-1" }, 201))
    );
    await expect(
      createUniqueBot({
        gameId: "game-1",
        sourceType: "STANDALONE",
        nameOverride: "Mule",
        maxHpOverride: 8,
      })
    ).resolves.toEqual({ id: "ub-1" });
  });

  it("rejects a body that is missing id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ botId: "bot-1" }, 201))
    );
    await expect(
      createUniqueBot({
        gameId: "game-1",
        sourceType: "OFFICIAL",
        botId: "bot-1",
      })
    ).rejects.toThrow(/id:/);
  });

  it("falls back to Failed to create unique bot when the server fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 500 }))
    );
    await expect(
      createUniqueBot({
        gameId: "game-1",
        sourceType: "STANDALONE",
        nameOverride: "Mule",
        maxHpOverride: 8,
      })
    ).rejects.toThrow("Failed to create unique bot");
  });
});

const attributeFigure = {
  base: 0,
  maxPotential: 0,
  upgrade: 0,
  effective: 0,
  signedUpgrade: null,
};

const holding = {
  id: "hold-1",
  characterId: "character-1",
  botId: "bot-1",
  displayName: "Mule",
  currentHp: 8,
  maxHpBonus: 0,
  effectiveMaxHp: 8,
  condition: "OPERATIONAL" as const,
  damageProfile: [],
  bot: null,
  attributes: {
    processingPower: attributeFigure,
    physicalPower: attributeFigure,
    finesseCapacity: attributeFigure,
    gridProtection: attributeFigure,
  },
  battery: {
    base: 1,
    maxPotential: 0,
    upgrade: 0,
    effectiveCapacity: 1,
    signedUpgrade: null,
    used: 0,
    remaining: 1,
  },
  isBeyondRepair: false,
  mayRoll: true,
  rollBlockedReason: null,
};

describe("mintUniqueBotForCharacter", () => {
  it("returns the created holding from a well-formed body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(holding, 201))
    );
    const created = await mintUniqueBotForCharacter("character-1", {
      gameId: "game-1",
      sourceType: "STANDALONE",
      nameOverride: "Mule",
      maxHpOverride: 8,
    });
    expect(created.id).toBe("hold-1");
    expect(created.displayName).toBe("Mule");
    expect(created.characterId).toBe("character-1");
    expect(created.sourceType).toBe("OFFICIAL");
  });

  it("falls back to Failed to create unique bot when the server fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 500 }))
    );
    await expect(
      mintUniqueBotForCharacter("character-1", {
        gameId: "game-1",
        sourceType: "STANDALONE",
        nameOverride: "Mule",
        maxHpOverride: 8,
      })
    ).rejects.toThrow("Failed to create unique bot");
  });
});

describe("updateUniqueBot", () => {
  it("returns the updated record from a well-formed body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(record)));
    await expect(
      updateUniqueBot("ub-1", { nameOverride: "Mule" })
    ).resolves.toEqual(record);
  });

  it("rejects a body that is missing id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          ownerUserId: "user-1",
          gameId: "game-1",
          sourceType: "STANDALONE",
          nameOverride: "Mule",
        })
      )
    );
    await expect(
      updateUniqueBot("ub-1", { nameOverride: "Mule" })
    ).rejects.toThrow(/id:/);
  });
});
