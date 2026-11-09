import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";
import type * as UniqueItemPrisma from "@/app/lib/prisma/uniqueItem";

const createUniqueItemMock = vi.fn();

vi.mock("@/app/lib/prisma/uniqueItem", async (importOriginal) => {
  const actual = await importOriginal<typeof UniqueItemPrisma>();
  return {
    ...actual,
    createUniqueItem: (...args: unknown[]) => createUniqueItemMock(...args),
  };
});

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: async () => null,
}));

describe("POST /api/unique-items botInstallableOverride", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createUniqueItemMock.mockResolvedValue({ id: "u-1" });
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/unique-items/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({
        sourceType: "STANDALONE",
        nameOverride: "Rig",
        weightOverride: 2,
        botInstallableOverride: true,
      })
    );
    expect(response.status).toBe(401);
    expect(createUniqueItemMock).not.toHaveBeenCalled();
  });

  it("stores a unique override for bot-installable and vehicle-mountable", async () => {
    const { POST } = await import("@/app/api/unique-items/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          sourceType: "STANDALONE",
          nameOverride: "Rig",
          weightOverride: 2,
          vehicleMountableOverride: true,
          botInstallableOverride: true,
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(201);
    expect(createUniqueItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        nameOverride: "Rig",
        weightOverride: 2,
        vehicleMountableOverride: true,
        botInstallableOverride: true,
      })
    );
  });

  it("returns 400 when botInstallableOverride is not a boolean", async () => {
    const { POST } = await import("@/app/api/unique-items/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          sourceType: "STANDALONE",
          nameOverride: "Rig",
          weightOverride: 2,
          botInstallableOverride: "yes",
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(400);
    expect(createUniqueItemMock).not.toHaveBeenCalled();
  });
});
