import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";
import { CharacterDeletionTransactionError } from "@/app/api/shared/errors";

const getCharacterMock = vi.fn();
const deleteCharacterMock = vi.fn();
const characterBelongsToUserMock = vi.fn();

vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: getCharacterMock,
  deleteCharacter: deleteCharacterMock,
}));

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));

describe("/api/characters/[id] handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
  });

  it("GET returns 403 when character is not owned", async () => {
    characterBelongsToUserMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
  });

  it("GET returns 404 when character does not exist", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(404);
  });

  it("DELETE returns 500 on CharacterDeletionTransactionError", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    deleteCharacterMock.mockRejectedValue(
      new CharacterDeletionTransactionError("deleteCharacter")
    );
    const { DELETE } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(500);
  });

  it("DELETE returns 204 on success", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    deleteCharacterMock.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/characters/[id]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(204);
  });
});
