import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeParams } from "../helpers";

const getUniqueItemMock = vi.fn();
const updateUniqueItemMock = vi.fn();

vi.mock("@/app/lib/prisma/uniqueItem", () => ({
  getUniqueItem: (...args: unknown[]) => getUniqueItemMock(...args),
  getResolvedUniqueItem: vi.fn(),
  updateUniqueItem: (...args: unknown[]) => updateUniqueItemMock(...args),
  deleteUniqueItem: vi.fn(),
}));

const weld = {
  name: "Weld",
  description: null,
  notes: null,
  numberOfDice: 0,
  attribute: "processingPower",
  damage: null,
};

describe("PATCH /api/unique-items/[id] bot actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUniqueItemMock.mockResolvedValue({ id: "u-1" });
    updateUniqueItemMock.mockResolvedValue({ id: "u-1" });
  });

  it("PATCH stores a bot action override", async () => {
    const { PATCH } = await import("@/app/api/unique-items/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ botActionsOverride: [weld] }),
      makeParams({ id: "u-1" })
    );
    expect(response.status).toBe(200);
    expect(updateUniqueItemMock).toHaveBeenCalledWith("u-1", {
      botActionsOverride: [weld],
    });
  });

  it("PATCH clears a bot action override so the item inherits the template list", async () => {
    const { PATCH } = await import("@/app/api/unique-items/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ botActionsOverride: null }),
      makeParams({ id: "u-1" })
    );
    expect(response.status).toBe(200);
    expect(updateUniqueItemMock).toHaveBeenCalledWith("u-1", {
      botActionsOverride: null,
    });
  });

  it("PATCH rejects Grid Protection as a bot action attribute", async () => {
    const { PATCH } = await import("@/app/api/unique-items/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({
        botActionsOverride: [
          { name: "Weld", numberOfDice: 0, attribute: "gridProtection" },
        ],
      }),
      makeParams({ id: "u-1" })
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      details: expect.stringContaining(
        "Grid Protection is not a bot action attribute."
      ),
    });
    expect(updateUniqueItemMock).not.toHaveBeenCalled();
  });
});
