import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";
import {
  CharacterCreationTransactionError,
  ValidationError,
} from "@/app/api/shared/errors";

const getUserMock = vi.fn();
const getCharactersByUserIdMock = vi.fn();
const createCharacterWithRelationsMock = vi.fn();
const safeParseMock = vi.fn();
const computeCharacterRequestDataMock = vi.fn();

vi.mock("@/app/lib/prisma/user", () => ({
  getUser: getUserMock,
}));

vi.mock("@/app/lib/prisma/character", () => ({
  getCharactersByUserId: getCharactersByUserIdMock,
  createCharacterWithRelations: createCharacterWithRelationsMock,
}));

vi.mock("@/app/api/characters/schemas", () => ({
  characterCreationRequestSchema: { safeParse: safeParseMock },
}));

vi.mock("@/app/api/characters/parsing", () => ({
  computeCharacterRequestData: computeCharacterRequestDataMock,
}));

describe("/api/characters POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/characters/route");
    const response = await invokeRoute(POST, makeUnauthedRequest());
    expect(response.status).toBe(401);
  });

  it("returns 404 when user is missing in DB", async () => {
    getUserMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/characters/route");
    const response = await invokeRoute(POST, makeAuthedRequest({}, "user-1"));
    expect(response.status).toBe(404);
  });

  it("returns 400 on schema parse failure", async () => {
    getUserMock.mockResolvedValue({ id: "user-1" });
    safeParseMock.mockReturnValue({
      success: false,
      error: { issues: [{ message: "invalid body" }] },
    });
    const { POST } = await import("@/app/api/characters/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ bad: true }, "user-1")
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when computeCharacterRequestData throws ValidationError", async () => {
    getUserMock.mockResolvedValue({ id: "user-1" });
    safeParseMock.mockReturnValue({
      success: true,
      data: { path: { pathId: "path-1", rank: 1 } },
    });
    computeCharacterRequestDataMock.mockImplementation(() => {
      throw new ValidationError("bad stats");
    });
    const { POST } = await import("@/app/api/characters/route");
    const response = await invokeRoute(POST, makeAuthedRequest({}, "user-1"));
    expect(response.status).toBe(400);
  });

  it("returns 500 on CharacterCreationTransactionError", async () => {
    getUserMock.mockResolvedValue({ id: "user-1" });
    safeParseMock.mockReturnValue({
      success: true,
      data: { path: { pathId: "path-1", rank: 1 } },
    });
    computeCharacterRequestDataMock.mockReturnValue({});
    createCharacterWithRelationsMock.mockRejectedValue(
      new CharacterCreationTransactionError("createCharacter")
    );
    const { POST } = await import("@/app/api/characters/route");
    const response = await invokeRoute(POST, makeAuthedRequest({}, "user-1"));
    expect(response.status).toBe(500);
  });

  it("returns 201 on success", async () => {
    getUserMock.mockResolvedValue({ id: "user-1" });
    safeParseMock.mockReturnValue({
      success: true,
      data: { path: { pathId: "path-1", rank: 1 } },
    });
    computeCharacterRequestDataMock.mockReturnValue({});
    createCharacterWithRelationsMock.mockResolvedValue({ id: "char-1" });
    const { POST } = await import("@/app/api/characters/route");
    const response = await invokeRoute(POST, makeAuthedRequest({}, "user-1"));
    expect(response.status).toBe(201);
  });
});

describe("/api/characters GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/characters/route");
    const response = await invokeRoute(GET, makeUnauthedRequest());
    expect(response.status).toBe(401);
  });

  it("returns 200 with mapped character summaries", async () => {
    getCharactersByUserIdMock.mockResolvedValue([
      {
        id: "char-1",
        generalInformation: {
          name: "Nova",
          surname: "Voss",
          level: 2,
          avatarKey: null,
        },
        paths: [{ path: { name: "MEDIC" } }, { path: { name: "SNIPER" } }],
      },
    ]);
    const { GET } = await import("@/app/api/characters/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1")
    );

    expect(getCharactersByUserIdMock).toHaveBeenCalledWith("user-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      {
        id: "char-1",
        name: "Nova",
        surname: "Voss",
        level: 2,
        paths: ["MEDIC", "SNIPER"],
        avatarKey: null,
      },
    ]);
  });

  it("returns 500 when fetching characters throws", async () => {
    getCharactersByUserIdMock.mockRejectedValue(new Error("db down"));
    const { GET } = await import("@/app/api/characters/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1")
    );
    expect(response.status).toBe(500);
  });
});
