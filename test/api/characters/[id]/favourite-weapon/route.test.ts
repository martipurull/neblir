import { PathName } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeParams } from "../../../helpers";

const characterBelongsToUserMock = vi.fn();
const getCharacterPathsMock = vi.fn();
const getItemMock = vi.fn();
const updatePathCharacterMock = vi.fn();
const getCharacterMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));
vi.mock("@/app/lib/prisma/pathCharacter", () => ({
  getCharacterPaths: getCharacterPathsMock,
  updatePathCharacter: updatePathCharacterMock,
}));
vi.mock("@/app/lib/prisma/item", () => ({
  getItem: getItemMock,
}));
vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: getCharacterMock,
}));
vi.mock("@/app/lib/types/path", () => ({
  soldierFavouriteWeaponUpdateSchema: { safeParse: safeParseMock },
}));

describe("/api/characters/[id]/favourite-weapon PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 on invalid body", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      success: false,
      error: { issues: [{ message: "invalid" }] },
    });
    const { PATCH } =
      await import("@/app/api/characters/[id]/favourite-weapon/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when path is not Soldier", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      success: true,
      data: { pathId: "path-1", favouriteWeaponItemId: "item-1" },
    });
    getCharacterPathsMock.mockResolvedValue([
      {
        id: "pc-1",
        pathId: "path-1",
        path: { name: PathName.SLEUTH },
      },
    ]);
    const { PATCH } =
      await import("@/app/api/characters/[id]/favourite-weapon/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    expect(updatePathCharacterMock).not.toHaveBeenCalled();
  });

  it("returns 400 when catalogue item is not a weapon", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      success: true,
      data: { pathId: "path-1", favouriteWeaponItemId: "item-1" },
    });
    getCharacterPathsMock.mockResolvedValue([
      {
        id: "pc-1",
        pathId: "path-1",
        path: { name: PathName.SOLDIER },
      },
    ]);
    getItemMock.mockResolvedValue({ id: "item-1", type: "GENERAL_ITEM" });
    const { PATCH } =
      await import("@/app/api/characters/[id]/favourite-weapon/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    expect(updatePathCharacterMock).not.toHaveBeenCalled();
  });

  it("returns 200 on success", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      success: true,
      data: { pathId: "path-1", favouriteWeaponItemId: "item-1" },
    });
    getCharacterPathsMock.mockResolvedValue([
      {
        id: "pc-1",
        pathId: "path-1",
        path: { name: PathName.SOLDIER },
      },
    ]);
    getItemMock.mockResolvedValue({ id: "item-1", type: "WEAPON" });
    updatePathCharacterMock.mockResolvedValue({});
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      generalInformation: { name: "N", surname: "V", level: 1 },
      health: {},
      combatInformation: {},
      innateAttributes: {},
      learnedSkills: { generalSkills: {}, specialSkills: [] },
      wallet: [],
      inventory: [],
      notes: [],
      paths: [],
      features: [],
    });
    const { PATCH } =
      await import("@/app/api/characters/[id]/favourite-weapon/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(updatePathCharacterMock).toHaveBeenCalledWith("pc-1", {
      favouriteWeapon: { connect: { id: "item-1" } },
    });
  });
});
