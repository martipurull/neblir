import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeParams } from "../../../helpers";

const getGameMock = vi.fn();
const getCustomItemMock = vi.fn();
const updateCustomItemMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: (...args: unknown[]) => getGameMock(...args),
  userIsInGame: vi.fn(),
}));

vi.mock("@/app/lib/prisma/customItem", () => ({
  getCustomItem: (...args: unknown[]) => getCustomItemMock(...args),
  updateCustomItem: (...args: unknown[]) => updateCustomItemMock(...args),
  deleteCustomItem: vi.fn(),
}));

const weld = {
  name: "Weld",
  description: null,
  notes: null,
  numberOfDice: 0,
  attribute: "processingPower",
  damage: null,
};

describe("PATCH /api/games/[id]/custom-items/[customItemId] bot actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "user-1" });
    getCustomItemMock.mockResolvedValue({ id: "c-1", gameId: "g-1" });
    updateCustomItemMock.mockResolvedValue({ id: "c-1" });
  });

  const params = () => makeParams({ id: "g-1", customItemId: "c-1" });

  it("PATCH stores a bot action list", async () => {
    const { PATCH } =
      await import("@/app/api/games/[id]/custom-items/[customItemId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ botActions: [weld] }),
      params()
    );
    expect(response.status).toBe(200);
    expect(updateCustomItemMock).toHaveBeenCalledWith(
      "c-1",
      expect.objectContaining({ botActions: [weld] })
    );
  });

  it("PATCH rejects Grid Protection as a bot action attribute", async () => {
    const { PATCH } =
      await import("@/app/api/games/[id]/custom-items/[customItemId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({
        botActions: [
          { name: "Weld", numberOfDice: 0, attribute: "gridProtection" },
        ],
      }),
      params()
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      details: expect.stringContaining(
        "Grid Protection is not a bot action attribute."
      ),
    });
    expect(updateCustomItemMock).not.toHaveBeenCalled();
  });
});
