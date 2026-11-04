import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addCharactersToGame,
  revokeGameCharacterPlayGrant,
  setGameCharacterPlayGrant,
} from "@/lib/api/game";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("addCharactersToGame", () => {
  it("returns the parsed link result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          success: false,
          linkedCount: 1,
          linkedIds: ["char-1"],
          alreadyLinkedIds: [],
          failed: [
            { characterId: "char-2", reason: "Failed to link character" },
          ],
        })
      )
    );

    await expect(
      addCharactersToGame("game-1", [
        { characterId: "char-1", isPublic: true },
        { characterId: "char-2", isPublic: false },
      ])
    ).resolves.toEqual({
      success: false,
      linkedCount: 1,
      linkedIds: ["char-1"],
      alreadyLinkedIds: [],
      failed: [{ characterId: "char-2", reason: "Failed to link character" }],
    });
  });

  it("throws when the result is missing linked count", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          success: true,
          linkedIds: ["char-1"],
          alreadyLinkedIds: [],
          failed: [],
        })
      )
    );

    await expect(
      addCharactersToGame("game-1", [{ characterId: "char-1", isPublic: true }])
    ).rejects.toThrow(/linkedCount/);
  });
});

describe("setGameCharacterPlayGrant", () => {
  it("returns the parsed play grant", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ playGrantUserId: "user-2" }))
    );

    await expect(
      setGameCharacterPlayGrant("game-1", "char-1", "user-2")
    ).resolves.toEqual({ playGrantUserId: "user-2" });
  });

  it("throws when the play grant user is missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({})));

    await expect(
      setGameCharacterPlayGrant("game-1", "char-1", "user-2")
    ).rejects.toThrow(/playGrantUserId/);
  });
});

describe("revokeGameCharacterPlayGrant", () => {
  it("returns a cleared play grant", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ playGrantUserId: null }))
    );

    await expect(
      revokeGameCharacterPlayGrant("game-1", "char-1")
    ).resolves.toEqual({ playGrantUserId: null });
  });

  it("throws when the play grant user is missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({})));

    await expect(
      revokeGameCharacterPlayGrant("game-1", "char-1")
    ).rejects.toThrow(/playGrantUserId/);
  });
});
