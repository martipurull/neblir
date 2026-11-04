import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchPendingGameInvites,
  fetchReceivedGameInvites,
  inviteUsersToGame,
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

describe("fetchReceivedGameInvites", () => {
  it("returns the parsed invite list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse([
          {
            gameId: "game-1",
            gameName: "Ash Road",
            invitedByName: "Mara",
            createdAt: "2026-04-01T12:00:00.000Z",
          },
        ])
      )
    );

    await expect(fetchReceivedGameInvites()).resolves.toEqual([
      {
        gameId: "game-1",
        gameName: "Ash Road",
        invitedByName: "Mara",
        createdAt: "2026-04-01T12:00:00.000Z",
      },
    ]);
  });

  it("throws when an invite is missing its game name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse([
          {
            gameId: "game-1",
            invitedByName: "Mara",
            createdAt: "2026-04-01T12:00:00.000Z",
          },
        ])
      )
    );

    await expect(fetchReceivedGameInvites()).rejects.toThrow(/0\.gameName/);
  });
});

describe("fetchPendingGameInvites", () => {
  it("returns the parsed pending invite list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse([
          {
            invitedUserId: "user-1",
            invitedUserName: "Nia",
            invitedUserEmail: "nia@example.com",
            createdAt: "2026-04-02T08:00:00.000Z",
          },
        ])
      )
    );

    await expect(fetchPendingGameInvites("game-1")).resolves.toEqual([
      {
        invitedUserId: "user-1",
        invitedUserName: "Nia",
        invitedUserEmail: "nia@example.com",
        createdAt: "2026-04-02T08:00:00.000Z",
      },
    ]);
  });

  it("throws when a pending invite is missing its email", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse([
          {
            invitedUserId: "user-1",
            invitedUserName: "Nia",
            createdAt: "2026-04-02T08:00:00.000Z",
          },
        ])
      )
    );

    await expect(fetchPendingGameInvites("game-1")).rejects.toThrow(
      /0\.invitedUserEmail/
    );
  });
});

describe("inviteUsersToGame", () => {
  it("returns the parsed invite result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            invitedEmails: ["nia@example.com"],
            notFound: [],
            alreadyInGame: ["ada@example.com"],
            alreadyInvited: [],
            isSelf: [],
          },
          201
        )
      )
    );

    await expect(
      inviteUsersToGame("game-1", ["nia@example.com", "ada@example.com"])
    ).resolves.toEqual({
      invitedEmails: ["nia@example.com"],
      notFound: [],
      alreadyInGame: ["ada@example.com"],
      alreadyInvited: [],
      isSelf: [],
    });
  });

  it("throws when the result is missing invited emails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            notFound: [],
            alreadyInGame: [],
            alreadyInvited: [],
            isSelf: [],
          },
          201
        )
      )
    );

    await expect(
      inviteUsersToGame("game-1", ["nia@example.com"])
    ).rejects.toThrow(/invitedEmails/);
  });
});
