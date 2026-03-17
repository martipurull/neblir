import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const userIsInGameMock = vi.fn();
const serializeErrorMock = vi.fn((e: unknown) =>
  e instanceof Error ? e.message : String(e)
);

const characterUserFindManyMock = vi.fn();
const gameCharacterCreateMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    characterUser: { findMany: characterUserFindManyMock },
    gameCharacter: { create: gameCharacterCreateMock },
  },
}));

vi.mock("@/app/api/shared/errors", () => ({
  serializeError: serializeErrorMock,
}));

describe("POST /api/games/[id]/characters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/games/[id]/characters/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({ characterIds: ["c-1"] }),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when user is not part of the game", async () => {
    userIsInGameMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/games/[id]/characters/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ characterIds: ["c-1"] }, "user-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(403);
    expect(characterUserFindManyMock).not.toHaveBeenCalled();
    expect(gameCharacterCreateMock).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid body", async () => {
    userIsInGameMock.mockResolvedValue(true);
    const { POST } = await import("@/app/api/games/[id]/characters/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ characterIds: [] }, "user-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(400);
    expect(gameCharacterCreateMock).not.toHaveBeenCalled();
  });

  it("returns 403 when any requested characters are not owned by the user", async () => {
    userIsInGameMock.mockResolvedValue(true);
    // user owns only c-1, c-3 is not owned
    characterUserFindManyMock.mockResolvedValue([{ characterId: "c-1" }]);

    const { POST } = await import("@/app/api/games/[id]/characters/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ characterIds: ["c-1", "c-3"] }, "user-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(403);
    expect(gameCharacterCreateMock).not.toHaveBeenCalled();
  });

  it("links all owned characters successfully", async () => {
    userIsInGameMock.mockResolvedValue(true);
    characterUserFindManyMock.mockResolvedValue([
      { characterId: "c-1" },
      { characterId: "c-2" },
    ]);
    gameCharacterCreateMock.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/games/[id]/characters/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ characterIds: ["c-1", "c-2"] }, "user-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.linkedCount).toBe(2);
    expect(body.linkedIds.sort()).toEqual(["c-1", "c-2"]);
    expect(body.alreadyLinkedIds).toEqual([]);
    expect(body.failed).toEqual([]);
    expect(body.success).toBe(true);
    expect(gameCharacterCreateMock).toHaveBeenCalledTimes(2);
  });

  it("deduplicates input ids before processing", async () => {
    userIsInGameMock.mockResolvedValue(true);
    characterUserFindManyMock.mockResolvedValue([{ characterId: "c-1" }]);
    gameCharacterCreateMock.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/games/[id]/characters/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ characterIds: ["c-1", "c-1", "c-1"] }, "user-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.linkedCount).toBe(1);
    expect(gameCharacterCreateMock).toHaveBeenCalledTimes(1);
  });

  it("reports already-linked characters (P2002) without failing the batch", async () => {
    userIsInGameMock.mockResolvedValue(true);
    characterUserFindManyMock.mockResolvedValue([
      { characterId: "c-1" },
      { characterId: "c-2" },
    ]);
    gameCharacterCreateMock.mockImplementation(async ({ data }: any) => {
      if (data.characterId === "c-2") {
        // Route checks `instanceof Prisma.PrismaClientKnownRequestError`, so we need a real instance.
        const { Prisma } = await import("@prisma/client");
        throw new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "test",
        } as any);
      }
      return undefined;
    });

    const { POST } = await import("@/app/api/games/[id]/characters/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ characterIds: ["c-1", "c-2"] }, "user-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.linkedIds).toEqual(["c-1"]);
    expect(body.alreadyLinkedIds).toEqual(["c-2"]);
    expect(body.failed).toEqual([]);
  });

  it("returns partial failure details when a create throws non-P2002", async () => {
    userIsInGameMock.mockResolvedValue(true);
    characterUserFindManyMock.mockResolvedValue([
      { characterId: "c-1" },
      { characterId: "c-2" },
    ]);
    gameCharacterCreateMock.mockImplementation(async ({ data }: any) => {
      if (data.characterId === "c-2") {
        throw new Error("DB down");
      }
      return undefined;
    });

    const { POST } = await import("@/app/api/games/[id]/characters/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ characterIds: ["c-1", "c-2"] }, "user-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.linkedIds).toEqual(["c-1"]);
    expect(body.failed).toEqual([
      { characterId: "c-2", reason: "Failed to link character" },
    ]);
    expect(body.success).toBe(false);
    expect(serializeErrorMock).toHaveBeenCalled();
  });
});
