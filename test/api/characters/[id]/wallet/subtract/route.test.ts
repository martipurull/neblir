import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeParams } from "../../../../helpers";

const characterBelongsToUserMock = vi.fn();
const subtractCharacterCurrencyMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));

vi.mock("@/app/lib/prisma/characterCurrency", () => ({
  subtractCharacterCurrency: subtractCharacterCurrencyMock,
}));

vi.mock("@/app/lib/types/item", () => ({
  walletAdjustmentSchema: { safeParse: safeParseMock },
}));

describe("/api/characters/[id]/wallet/subtract POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for CURRENCY_NOT_FOUND", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: { currencyName: "CREDIT", amount: 3 },
      error: undefined,
    });
    subtractCharacterCurrencyMock.mockRejectedValue(new Error("CURRENCY_NOT_FOUND"));
    const { POST } = await import("@/app/api/characters/[id]/wallet/subtract/route");
    const response = await invokeRoute(POST, makeAuthedRequest({}), makeParams({ id: "char-1" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for INSUFFICIENT_FUNDS", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: { currencyName: "CREDIT", amount: 3 },
      error: undefined,
    });
    subtractCharacterCurrencyMock.mockRejectedValue(new Error("INSUFFICIENT_FUNDS"));
    const { POST } = await import("@/app/api/characters/[id]/wallet/subtract/route");
    const response = await invokeRoute(POST, makeAuthedRequest({}), makeParams({ id: "char-1" }));
    expect(response.status).toBe(400);
  });

  it("returns 500 for unexpected subtract errors", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: { currencyName: "CREDIT", amount: 3 },
      error: undefined,
    });
    subtractCharacterCurrencyMock.mockRejectedValue(new Error("boom"));
    const { POST } = await import("@/app/api/characters/[id]/wallet/subtract/route");
    const response = await invokeRoute(POST, makeAuthedRequest({}), makeParams({ id: "char-1" }));
    expect(response.status).toBe(500);
  });

  it("returns 200 on success", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: { currencyName: "CREDIT", amount: 3 },
      error: undefined,
    });
    subtractCharacterCurrencyMock.mockResolvedValue([{ currencyName: "CREDIT", quantity: 1 }]);
    const { POST } = await import("@/app/api/characters/[id]/wallet/subtract/route");
    const response = await invokeRoute(POST, makeAuthedRequest({}), makeParams({ id: "char-1" }));
    expect(response.status).toBe(200);
  });
});
