import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const userIsSuperAdminMock = vi.fn();
const getItemsMock = vi.fn();
const createItemMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: (...args: unknown[]) => userIsSuperAdminMock(...args),
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: async () => undefined,
}));

vi.mock("@/app/lib/prisma/item", () => ({
  getItems: (...args: unknown[]) => getItemsMock(...args),
  createItem: (...args: unknown[]) => createItemMock(...args),
}));

const servo = {
  type: "GENERAL_ITEM",
  accessType: "PLAYER",
  name: "Servo",
  confCost: 1,
  description: "A servo",
  weight: 1,
  usage: "Bolt it on",
  vehicleMountable: true,
  botInstallable: true,
};

describe("POST /api/items botInstallable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
    getItemsMock.mockResolvedValue([]);
    createItemMock.mockImplementation(async (data: { name: string }) => ({
      id: "item-1",
      ...data,
    }));
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/items/route");
    const response = await invokeRoute(POST, makeUnauthedRequest(servo));
    expect(response.status).toBe(401);
    expect(createItemMock).not.toHaveBeenCalled();
  });

  it("stores both vehicle-mountable and bot-installable", async () => {
    const { POST } = await import("@/app/api/items/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(servo, "admin-1")
    );
    expect(response.status).toBe(201);
    expect(createItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Servo",
        vehicleMountable: true,
        botInstallable: true,
      }),
      { officialCatalogueWrite: true }
    );
  });

  it("returns 400 when botInstallable is not a boolean", async () => {
    const { POST } = await import("@/app/api/items/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ ...servo, botInstallable: "yes" }, "admin-1")
    );
    expect(response.status).toBe(400);
    expect(createItemMock).not.toHaveBeenCalled();
  });

  it("stores bot actions on a bot-installable item", async () => {
    const botActions = [
      {
        name: "Flare",
        description: null,
        notes: null,
        numberOfDice: 2,
        attribute: null,
        damage: null,
      },
    ];
    const { POST } = await import("@/app/api/items/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ ...servo, botActions }, "admin-1")
    );
    expect(response.status).toBe(201);
    expect(createItemMock).toHaveBeenCalledWith(
      expect.objectContaining({ botActions }),
      { officialCatalogueWrite: true }
    );
  });

  it("rejects Grid Protection as an item bot action attribute", async () => {
    const { POST } = await import("@/app/api/items/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          ...servo,
          botActions: [
            { name: "Flare", numberOfDice: 1, attribute: "gridProtection" },
          ],
        },
        "admin-1"
      )
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      details: expect.stringContaining(
        "Grid Protection is not a bot action attribute."
      ),
    });
    expect(createItemMock).not.toHaveBeenCalled();
  });
});
