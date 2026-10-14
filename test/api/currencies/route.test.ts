import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const getCurrenciesMock = vi.fn();
const userIsSuperAdminMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/currency", () => ({
  getCurrencies: getCurrenciesMock,
}));

const storedCurrencies = [
  {
    id: "mrark",
    name: "MRARK",
    imageKey: "currencies-mrark.png",
    exchangeValue: 4,
    protectedFromOfficialImport: false,
  },
  {
    id: "aaa",
    name: "AAA",
    imageKey: "currencies-aaa.png",
    exchangeValue: 9,
    protectedFromOfficialImport: false,
  },
  {
    id: "conf",
    name: "CONF",
    imageKey: "currencies-conf.png",
    exchangeValue: 1,
    protectedFromOfficialImport: false,
  },
];

describe("/api/currencies route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(false);
    getCurrenciesMock.mockResolvedValue(storedCurrencies);
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(GET, makeUnauthedRequest());
    expect(response.status).toBe(401);
    expect(getCurrenciesMock).not.toHaveBeenCalled();
  });

  it("GET lists id, name, and image key for a signed-in user, CONF first then by stored name", async () => {
    const { GET } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(GET, makeAuthedRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { id: "conf", name: "CONF", imageKey: "currencies-conf.png" },
      { id: "aaa", name: "AAA", imageKey: "currencies-aaa.png" },
      { id: "mrark", name: "MRARK", imageKey: "currencies-mrark.png" },
    ]);
  });

  it("GET returns 500 when listing currencies fails", async () => {
    getCurrenciesMock.mockRejectedValue(new Error("db down"));
    const { GET } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(GET, makeAuthedRequest());
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      message: "Error fetching currencies",
    });
  });

  it("GET includes each exchange value for a super-admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(true);
    const { GET } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(GET, makeAuthedRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      {
        id: "conf",
        name: "CONF",
        imageKey: "currencies-conf.png",
        exchangeValue: 1,
      },
      {
        id: "aaa",
        name: "AAA",
        imageKey: "currencies-aaa.png",
        exchangeValue: 9,
      },
      {
        id: "mrark",
        name: "MRARK",
        imageKey: "currencies-mrark.png",
        exchangeValue: 4,
      },
    ]);
  });
});
