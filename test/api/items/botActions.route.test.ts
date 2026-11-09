import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeParams } from "../helpers";

const userIsSuperAdminMock = vi.fn();
const getItemsMock = vi.fn();
const updateItemMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: (...args: unknown[]) => userIsSuperAdminMock(...args),
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: async () => undefined,
}));

vi.mock("@/app/lib/prisma/item", () => ({
  getItems: (...args: unknown[]) => getItemsMock(...args),
  getItem: vi.fn(),
  updateItem: (...args: unknown[]) => updateItemMock(...args),
  deleteItem: vi.fn(),
}));

const weld = {
  name: "Weld",
  description: null,
  notes: null,
  numberOfDice: 0,
  attribute: "processingPower",
  damage: null,
};

describe("PATCH /api/items/[id] bot actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
    getItemsMock.mockResolvedValue([]);
    updateItemMock.mockResolvedValue({ id: "item-1", name: "Servo" });
  });

  it("PATCH stores a bot action list", async () => {
    const { PATCH } = await import("@/app/api/items/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ botActions: [weld] }),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(200);
    expect(updateItemMock).toHaveBeenCalledWith(
      "item-1",
      { botActions: [weld] },
      { officialCatalogueWrite: true }
    );
  });

  it("PATCH rejects Grid Protection as a bot action attribute", async () => {
    const { PATCH } = await import("@/app/api/items/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({
        botActions: [
          { name: "Weld", numberOfDice: 0, attribute: "gridProtection" },
        ],
      }),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Error parsing item update request",
      details: "Invalid input",
    });
    expect(updateItemMock).not.toHaveBeenCalled();
  });
});
