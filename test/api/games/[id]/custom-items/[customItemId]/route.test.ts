import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getCustomItemMock = vi.fn();
const updateCustomItemMock = vi.fn();
const deleteCustomItemMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/customItem", () => ({
  getCustomItem: getCustomItemMock,
  updateCustomItem: updateCustomItemMock,
  deleteCustomItem: deleteCustomItemMock,
}));

vi.mock("@/app/lib/types/item", () => ({
  customItemUpdateSchema: { safeParse: safeParseMock },
}));

describe("/api/games/[id]/custom-items/[customItemId] handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import(
      "@/app/api/games/[id]/custom-items/[customItemId]/route"
    );
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "g-1", customItemId: "c-1" })
    );
    expect(response.status).toBe(401);
  });

  it("GET returns 404 when game not found", async () => {
    getGameMock.mockResolvedValue(null);
    const { GET } = await import(
      "@/app/api/games/[id]/custom-items/[customItemId]/route"
    );
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "g-1", customItemId: "c-1" })
    );
    expect(response.status).toBe(404);
  });

  it("GET returns 200 when item exists and user can access game", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-2" });
    userIsInGameMock.mockResolvedValue(true);
    getCustomItemMock.mockResolvedValue({ id: "c-1", gameId: "g-1" });
    const { GET } = await import(
      "@/app/api/games/[id]/custom-items/[customItemId]/route"
    );

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "g-1", customItemId: "c-1" })
    );
    expect(response.status).toBe(200);
  });

  it("PATCH returns 400 when payload is invalid", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    getCustomItemMock.mockResolvedValue({ id: "c-1", gameId: "g-1" });
    safeParseMock.mockReturnValue({
      error: { issues: [{ message: "bad payload" }] },
      data: undefined,
    });
    const { PATCH } = await import(
      "@/app/api/games/[id]/custom-items/[customItemId]/route"
    );

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ bad: true }),
      makeParams({ id: "g-1", customItemId: "c-1" })
    );
    expect(response.status).toBe(400);
  });

  it("PATCH returns 200 on success", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    getCustomItemMock.mockResolvedValue({ id: "c-1", gameId: "g-1" });
    safeParseMock.mockReturnValue({ data: { name: "updated" }, error: undefined });
    updateCustomItemMock.mockResolvedValue({ id: "c-1", name: "updated" });
    const { PATCH } = await import(
      "@/app/api/games/[id]/custom-items/[customItemId]/route"
    );

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "updated" }),
      makeParams({ id: "g-1", customItemId: "c-1" })
    );
    expect(response.status).toBe(200);
  });

  it("DELETE returns 204 on success", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    getCustomItemMock.mockResolvedValue({ id: "c-1", gameId: "g-1" });
    deleteCustomItemMock.mockResolvedValue(undefined);
    const { DELETE } = await import(
      "@/app/api/games/[id]/custom-items/[customItemId]/route"
    );

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "g-1", customItemId: "c-1" })
    );
    expect(response.status).toBe(204);
  });
});
