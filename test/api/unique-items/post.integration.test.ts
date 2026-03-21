/**
 * POST /api/unique-items with real Zod parsing and real prismaDataFromUniqueItemCreate.
 * Prisma persistence remains mocked via createUniqueItem.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaDataFromUniqueItemCreate } from "@/app/lib/prisma/uniqueItem";
import { uniqueItemCreateSchema } from "@/app/lib/types/item";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const getGameMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/uniqueItem", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("@/app/lib/prisma/uniqueItem")>();
  return {
    ...mod,
    createUniqueItem: vi.fn(),
  };
});

describe("POST /api/unique-items (real schema + mapper)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { createUniqueItem } = await import("@/app/lib/prisma/uniqueItem");
    vi.mocked(createUniqueItem).mockResolvedValue({
      id: "created-id",
    } as never);
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/unique-items/route");
    const response = await invokeRoute(POST, makeUnauthedRequest());
    expect(response.status).toBe(401);
  });

  it("returns 400 when STANDALONE body fails Zod (missing weight)", async () => {
    const { POST } = await import("@/app/api/unique-items/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceType: "STANDALONE",
        nameOverride: "Only name",
      })
    );
    expect(response.status).toBe(400);
    const { createUniqueItem } = await import("@/app/lib/prisma/uniqueItem");
    expect(createUniqueItem).not.toHaveBeenCalled();
  });

  it("returns 400 when CUSTOM_ITEM has no gameId (business rule after parse)", async () => {
    const { POST } = await import("@/app/api/unique-items/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceType: "CUSTOM_ITEM",
        itemId: "507f1f77bcf86cd799439011",
      })
    );
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(String(json.message ?? json)).toMatch(/gameId is required/i);
    const { createUniqueItem } = await import("@/app/lib/prisma/uniqueItem");
    expect(createUniqueItem).not.toHaveBeenCalled();
  });

  it("calls createUniqueItem with prismaDataFromUniqueItemCreate output for valid STANDALONE", async () => {
    const { POST } = await import("@/app/api/unique-items/route");
    const body = {
      sourceType: "STANDALONE" as const,
      nameOverride: "Charm",
      weightOverride: 0.5,
      descriptionOverride: "Glows faintly",
    };
    const parsed = uniqueItemCreateSchema.parse(body);
    const { createUniqueItem } = await import("@/app/lib/prisma/uniqueItem");

    const response = await invokeRoute(POST, makeAuthedRequest(body));
    expect(response.status).toBe(201);
    expect(createUniqueItem).toHaveBeenCalledTimes(1);
    expect(createUniqueItem).toHaveBeenCalledWith(
      prismaDataFromUniqueItemCreate("user-1", undefined, parsed)
    );
  });

  it("validates game and passes gameId through mapper when STANDALONE includes gameId", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "user-1" });
    const { POST } = await import("@/app/api/unique-items/route");
    const body = {
      sourceType: "STANDALONE" as const,
      nameOverride: "Tied item",
      weightOverride: 1,
      gameId: "g-1",
    };
    const parsed = uniqueItemCreateSchema.parse(body);
    const { createUniqueItem } = await import("@/app/lib/prisma/uniqueItem");

    const response = await invokeRoute(POST, makeAuthedRequest(body));
    expect(response.status).toBe(201);
    expect(getGameMock).toHaveBeenCalledWith("g-1");
    expect(createUniqueItem).toHaveBeenCalledWith(
      prismaDataFromUniqueItemCreate("user-1", "g-1", parsed)
    );
  });
});
