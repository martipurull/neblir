import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const characterBelongsToUserMock = vi.fn();
const addCharacterCurrencyMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));

vi.mock("@/app/lib/prisma/characterCurrency", () => ({
  addCharacterCurrency: addCharacterCurrencyMock,
}));

vi.mock("@/app/lib/types/item", () => ({
  walletAdjustmentSchema: { safeParse: safeParseMock },
}));

describe("/api/characters/[id]/wallet/add POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when character is not owned", async () => {
    characterBelongsToUserMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/characters/[id]/wallet/add/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 400 when body validation fails", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: undefined,
      error: { issues: [{ message: "invalid adjust body" }] },
    });
    const { POST } = await import("@/app/api/characters/[id]/wallet/add/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 200 on success", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: { currencyName: "CREDIT", amount: 1 },
      error: undefined,
    });
    addCharacterCurrencyMock.mockResolvedValue([
      { currencyName: "CREDIT", quantity: 1 },
    ]);
    const { POST } = await import("@/app/api/characters/[id]/wallet/add/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/characters/[id]/wallet/add/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
  });
});
