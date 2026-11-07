import { afterEach, describe, expect, it, vi } from "vitest";
import { createUniqueBot, updateUniqueBot } from "@/lib/api/uniqueBots";

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
