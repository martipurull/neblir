import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();
const createCustomItemMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: (...args: unknown[]) => getGameMock(...args),
  userIsInGame: async () => true,
}));

vi.mock("@/app/lib/prisma/customItem", () => ({
  getCustomItemsByGame: async () => [],
  createCustomItem: (...args: unknown[]) => createCustomItemMock(...args),
}));

describe("POST custom items botInstallable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    createCustomItemMock.mockImplementation(async (data: { name: string }) => ({
      id: "ci-1",
      ...data,
    }));
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/games/[id]/custom-items/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({ name: "Servo", weight: 1, botInstallable: true }),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
    expect(createCustomItemMock).not.toHaveBeenCalled();
  });

  it("stores bot-installable beside vehicle-mountable", async () => {
    const { POST } = await import("@/app/api/games/[id]/custom-items/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          name: "Servo",
          weight: 1,
          vehicleMountable: true,
          botInstallable: true,
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(createCustomItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: "g-1",
        name: "Servo",
        vehicleMountable: true,
        botInstallable: true,
      })
    );
  });

  it("returns 400 when botInstallable is not a boolean", async () => {
    const { POST } = await import("@/app/api/games/[id]/custom-items/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { name: "Servo", weight: 1, botInstallable: "yes" },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(createCustomItemMock).not.toHaveBeenCalled();
  });
});
