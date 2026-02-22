import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const characterBelongsToUserMock = vi.fn();
const replaceCharacterWalletMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));

vi.mock("@/app/lib/prisma/characterCurrency", () => ({
  replaceCharacterWallet: replaceCharacterWalletMock,
}));

vi.mock("@/app/lib/types/item", () => ({
  walletSchema: { safeParse: safeParseMock },
}));

describe("/api/characters/[id]/wallet PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { PATCH } = await import("@/app/api/characters/[id]/wallet/route");
    const response = await invokeRoute(
      PATCH,
      makeUnauthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 on invalid wallet body", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: undefined,
      error: { issues: [{ message: "invalid wallet" }] },
    });
    const { PATCH } = await import("@/app/api/characters/[id]/wallet/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ bad: true }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when currency quantity is negative", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: [{ currencyName: "CREDIT", quantity: -2 }],
      error: undefined,
    });
    const { PATCH } = await import("@/app/api/characters/[id]/wallet/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 200 on success", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: [{ currencyName: "CREDIT", quantity: 5 }],
      error: undefined,
    });
    replaceCharacterWalletMock.mockResolvedValue([
      { currencyName: "CREDIT", quantity: 5 },
    ]);
    const { PATCH } = await import("@/app/api/characters/[id]/wallet/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
  });
});
