import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeParams } from "../../../helpers";

const characterBelongsToUserMock = vi.fn();
const updateCharacterMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));
vi.mock("@/app/lib/prisma/character", () => ({
  updateCharacter: updateCharacterMock,
}));
vi.mock("@/app/lib/types/character", () => ({
  characterNotesSchema: { safeParse: safeParseMock },
}));

describe("/api/characters/[id]/notes PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 on invalid notes body", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: undefined,
      error: { issues: [{ message: "invalid notes" }] },
    });
    const { PATCH } = await import("@/app/api/characters/[id]/notes/route");
    const response = await invokeRoute(PATCH, makeAuthedRequest({}), makeParams({ id: "char-1" }));
    expect(response.status).toBe(400);
  });

  it("returns 200 on success", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({ data: { personal: "hello" }, error: undefined });
    updateCharacterMock.mockResolvedValue({ id: "char-1" });
    const { PATCH } = await import("@/app/api/characters/[id]/notes/route");
    const response = await invokeRoute(PATCH, makeAuthedRequest({}), makeParams({ id: "char-1" }));
    expect(response.status).toBe(200);
  });
});
