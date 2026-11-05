import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const prismaMock = vi.hoisted(() => ({
  game: { findUnique: vi.fn() },
  gameCharacter: { findFirst: vi.fn() },
  itemCharacter: { findMany: vi.fn(), updateMany: vi.fn() },
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: prismaMock,
}));

const game = { id: "g-1", gameMaster: "gm-1" };

const flatHoldings = [
  { id: "ic-1", itemLocation: "Indira's Flat", stashGameId: "g-1" },
  { id: "ic-2", itemLocation: "indira flat", stashGameId: "g-1" },
  { id: "ic-other", itemLocation: "Indira's Flat", stashGameId: "g-2" },
  { id: "ic-3", itemLocation: "Armoury", stashGameId: "g-1" },
];

function asGameMaster() {
  prismaMock.game.findUnique.mockResolvedValue(game);
  prismaMock.gameCharacter.findFirst.mockResolvedValue({ id: "gc-1" });
}

function asPlayerWithPlayControl() {
  prismaMock.game.findUnique.mockResolvedValue(game);
  prismaMock.gameCharacter.findFirst.mockResolvedValue({ id: "gc-owner" });
}

describe("PATCH /api/games/[id]/stashes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.itemCharacter.updateMany.mockResolvedValue({ count: 1 });
  });

  it("returns 401 when the caller is not signed in and does not write", async () => {
    const { PATCH } = await import("@/app/api/games/[id]/stashes/route");
    const response = await invokeRoute(
      PATCH,
      makeUnauthedRequest({ from: "Indira's Flat", placeName: "Amber loft" }),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
    expect(prismaMock.itemCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller has no play control in the game and does not write", async () => {
    prismaMock.game.findUnique.mockResolvedValue(game);
    prismaMock.gameCharacter.findFirst.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/games/[id]/stashes/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Indira's Flat", placeName: "Amber loft" },
        "player-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
    expect(prismaMock.itemCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("returns 403 when the game master has no linked character and does not write", async () => {
    prismaMock.game.findUnique.mockResolvedValue(game);
    prismaMock.gameCharacter.findFirst.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/games/[id]/stashes/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Indira's Flat", placeName: "Amber loft" },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
    expect(prismaMock.itemCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("returns 404 when the game does not exist and does not write", async () => {
    prismaMock.game.findUnique.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/games/[id]/stashes/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Indira's Flat", placeName: "Amber loft" },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
    expect((await response.json()).message).toBe("Game not found");
    expect(prismaMock.itemCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("returns 404 when that stash is not on the game and does not write", async () => {
    asPlayerWithPlayControl();
    prismaMock.itemCharacter.findMany.mockResolvedValue([
      { id: "ic-3", itemLocation: "Armoury", stashGameId: "g-1" },
    ]);
    const { PATCH } = await import("@/app/api/games/[id]/stashes/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Indira's Flat", placeName: "Amber loft" },
        "player-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
    expect((await response.json()).message).toBe("Stash not found");
    expect(prismaMock.itemCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is invalid and does not write", async () => {
    const { PATCH } = await import("@/app/api/games/[id]/stashes/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ from: "Indira's Flat", placeName: 1 }, "player-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(prismaMock.game.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.itemCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("rejects an empty name and does not write", async () => {
    asPlayerWithPlayControl();
    prismaMock.itemCharacter.findMany.mockResolvedValue(flatHoldings);
    const { PATCH } = await import("@/app/api/games/[id]/stashes/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Indira's Flat", placeName: "   " },
        "player-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe("Enter a place name.");
    expect(prismaMock.itemCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a punctuation-only name and does not write", async () => {
    asPlayerWithPlayControl();
    prismaMock.itemCharacter.findMany.mockResolvedValue(flatHoldings);
    const { PATCH } = await import("@/app/api/games/[id]/stashes/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Indira's Flat", placeName: "!!!" },
        "player-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe("Enter a place name.");
    expect(prismaMock.itemCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a name that folds to carried and does not write", async () => {
    asPlayerWithPlayControl();
    prismaMock.itemCharacter.findMany.mockResolvedValue(flatHoldings);
    const { PATCH } = await import("@/app/api/games/[id]/stashes/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Indira's Flat", placeName: "carried" },
        "player-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe(
      "That word is reserved for items the character is carrying. Choose a place name."
    );
    expect(prismaMock.itemCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a vehicle cargo or mounted location and does not write", async () => {
    asPlayerWithPlayControl();
    prismaMock.itemCharacter.findMany.mockResolvedValue(flatHoldings);
    const { PATCH } = await import("@/app/api/games/[id]/stashes/route");
    const cargo = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Indira's Flat", placeName: "vehicle:vc-1" },
        "player-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(cargo.status).toBe(400);
    expect((await cargo.json()).message).toBe(
      "That name is reserved for items in or on a vehicle. Use the vehicle's cargo or mount controls, or choose a place name."
    );

    const mounted = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Indira's Flat", placeName: "  vehicle-mounted:vc-1  " },
        "player-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(mounted.status).toBe(400);
    expect((await mounted.json()).message).toBe(
      "That name is reserved for items in or on a vehicle. Use the vehicle's cargo or mount controls, or choose a place name."
    );
    expect(prismaMock.itemCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("renames every holding recorded for this game under that fold", async () => {
    asPlayerWithPlayControl();
    prismaMock.itemCharacter.findMany.mockResolvedValue(flatHoldings);
    const { PATCH } = await import("@/app/api/games/[id]/stashes/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Indira's Flat", placeName: "Amber loft" },
        "player-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ placeName: "Amber loft" });
    expect(prismaMock.gameCharacter.findFirst).toHaveBeenCalledWith({
      where: {
        gameId: "g-1",
        OR: [
          { character: { users: { some: { userId: "player-1" } } } },
          { playGrantUserId: "player-1" },
        ],
      },
      select: { id: true },
    });
    expect(prismaMock.itemCharacter.updateMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.itemCharacter.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["ic-1", "ic-2"] } },
      data: { itemLocation: "Amber loft" },
    });
  });

  it("joins an existing stash and keeps the spelling already saved in this game", async () => {
    asPlayerWithPlayControl();
    prismaMock.itemCharacter.findMany.mockResolvedValue([
      { id: "ic-locker", itemLocation: "Locker", stashGameId: "g-1" },
      { id: "ic-flat", itemLocation: "Indira's Flat", stashGameId: "g-1" },
      { id: "ic-flat-case", itemLocation: "Indira's flat", stashGameId: "g-1" },
      { id: "ic-other", itemLocation: "indira flat", stashGameId: "g-2" },
    ]);
    const { PATCH } = await import("@/app/api/games/[id]/stashes/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Locker", placeName: "indira flat" },
        "player-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ placeName: "Indira's Flat" });
    expect(prismaMock.itemCharacter.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["ic-locker"] } },
      data: { itemLocation: "Indira's Flat" },
    });
  });

  it("renames when the caller is the game master of a game with a linked character", async () => {
    asGameMaster();
    prismaMock.itemCharacter.findMany.mockResolvedValue(flatHoldings);
    const { PATCH } = await import("@/app/api/games/[id]/stashes/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Indira's Flat", placeName: "Amber loft" },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ placeName: "Amber loft" });
    expect(prismaMock.gameCharacter.findFirst).toHaveBeenCalledWith({
      where: { gameId: "g-1" },
      select: { id: true },
    });
    expect(prismaMock.itemCharacter.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["ic-1", "ic-2"] } },
      data: { itemLocation: "Amber loft" },
    });
  });
});
