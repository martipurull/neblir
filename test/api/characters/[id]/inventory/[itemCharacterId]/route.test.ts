import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const deleteItemCharacterMock = vi.fn();
const characterBelongsToUserMock = vi.fn();
const getCharacterMock = vi.fn();
const updateCharacterMock = vi.fn();

vi.mock("@/app/lib/prisma/itemCharacter", () => ({
  deleteItemCharacter: deleteItemCharacterMock,
}));

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));

vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: getCharacterMock,
  updateCharacter: updateCharacterMock,
}));

describe("/api/characters/[id]/inventory/[itemCharacterId] DELETE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { DELETE } = await import(
      "@/app/api/characters/[id]/inventory/[itemCharacterId]/route"
    );
    const response = await invokeRoute(
      DELETE,
      makeUnauthedRequest(),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when character does not belong to user", async () => {
    characterBelongsToUserMock.mockResolvedValue(false);
    const { DELETE } = await import(
      "@/app/api/characters/[id]/inventory/[itemCharacterId]/route"
    );
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 500 when deleteItemCharacter rejects", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    deleteItemCharacterMock.mockRejectedValue(new Error("db fail"));
    const { DELETE } = await import(
      "@/app/api/characters/[id]/inventory/[itemCharacterId]/route"
    );
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(500);
  });

  it("returns 204 on successful deletion", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    deleteItemCharacterMock.mockResolvedValue(undefined);
    getCharacterMock.mockResolvedValue(null);
    const { DELETE } = await import(
      "@/app/api/characters/[id]/inventory/[itemCharacterId]/route"
    );
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(204);
    expect(deleteItemCharacterMock).toHaveBeenCalledWith("ic-1");
  });
});
