import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeParams } from "../../../helpers";

const characterBelongsToUserMock = vi.fn();
const getCharacterMock = vi.fn();
const updateCharacterMock = vi.fn();
const partialMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));
vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: getCharacterMock,
  updateCharacter: updateCharacterMock,
}));
vi.mock("@/app/lib/types/character", () => ({
  generalInformationSchema: {
    partial: partialMock,
  },
}));

describe("/api/characters/[id]/general-info PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    partialMock.mockReturnValue({ safeParse: safeParseMock });
  });

  it("returns 400 on invalid body", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: undefined,
      error: { issues: [{ message: "invalid general info" }] },
    });
    const { PATCH } = await import(
      "@/app/api/characters/[id]/general-info/route"
    );
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when character is missing", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({ data: { name: "new" }, error: undefined });
    getCharacterMock.mockResolvedValue(null);
    const { PATCH } = await import(
      "@/app/api/characters/[id]/general-info/route"
    );
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 200 on success", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({ data: { name: "new" }, error: undefined });
    getCharacterMock.mockResolvedValue({ generalInformation: { name: "old" } });
    updateCharacterMock.mockResolvedValue({ id: "char-1" });
    const { PATCH } = await import(
      "@/app/api/characters/[id]/general-info/route"
    );
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
  });
});
