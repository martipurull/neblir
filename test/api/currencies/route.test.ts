import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const getCurrenciesMock = vi.fn();
const createCurrencyMock = vi.fn();
const userIsSuperAdminMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/lib/prisma/currency", () => ({
  getCurrencies: getCurrenciesMock,
  createCurrency: createCurrencyMock,
}));

const newCurrency = {
  name: "Credit",
  exchangeValue: 12,
  imageKey: "currencies-credit.png",
};

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
    createCurrencyMock.mockResolvedValue({
      id: "credit",
      ...newCurrency,
      protectedFromOfficialImport: true,
    });
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

  it("POST returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(POST, makeUnauthedRequest(newCurrency));
    expect(response.status).toBe(401);
    expect(createCurrencyMock).not.toHaveBeenCalled();
  });

  it("POST returns 403 when the user is not a super-admin", async () => {
    const { POST } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(POST, makeAuthedRequest(newCurrency));
    expect(response.status).toBe(403);
    expect(createCurrencyMock).not.toHaveBeenCalled();
  });

  it("POST returns 201 with the currency and raises currencies seed drift", async () => {
    userIsSuperAdminMock.mockResolvedValue(true);
    getCurrenciesMock.mockResolvedValue([]);
    const { POST } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(POST, makeAuthedRequest(newCurrency));
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: "credit",
      ...newCurrency,
      protectedFromOfficialImport: true,
    });
    expect(createCurrencyMock).toHaveBeenCalledWith({
      ...newCurrency,
      protectedFromOfficialImport: true,
    });
    expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["currencies"]);
  });

  it("POST returns 400 when the image is missing", async () => {
    userIsSuperAdminMock.mockResolvedValue(true);
    const { POST } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ name: "Credit", exchangeValue: 12 })
    );
    expect(response.status).toBe(400);
    expect(createCurrencyMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when the image is blank", async () => {
    userIsSuperAdminMock.mockResolvedValue(true);
    const { POST } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ ...newCurrency, imageKey: "   " })
    );
    expect(response.status).toBe(400);
    expect(createCurrencyMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when the exchange value is below 1", async () => {
    userIsSuperAdminMock.mockResolvedValue(true);
    const { POST } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ ...newCurrency, exchangeValue: 0 })
    );
    expect(response.status).toBe(400);
    expect(createCurrencyMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when the exchange value is fractional", async () => {
    userIsSuperAdminMock.mockResolvedValue(true);
    const { POST } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ ...newCurrency, exchangeValue: 1.5 })
    );
    expect(response.status).toBe(400);
    expect(createCurrencyMock).not.toHaveBeenCalled();
  });

  it("POST returns 409 when the Official name matches after case and extra spaces", async () => {
    userIsSuperAdminMock.mockResolvedValue(true);
    getCurrenciesMock.mockResolvedValue([{ id: "nord", name: "Nord Coin" }]);
    const { POST } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        ...newCurrency,
        name: "  nord   coin ",
      })
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      message: "This Official name is already taken",
    });
    expect(createCurrencyMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when CONF is created with an exchange value other than 100", async () => {
    userIsSuperAdminMock.mockResolvedValue(true);
    getCurrenciesMock.mockResolvedValue([]);
    const { POST } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        name: "CONF",
        exchangeValue: 50,
        imageKey: "currencies-conf.png",
      })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "CONF's name and exchange value cannot be changed",
    });
    expect(createCurrencyMock).not.toHaveBeenCalled();
  });

  it("POST creates CONF when the name is CONF and the exchange value is 100", async () => {
    userIsSuperAdminMock.mockResolvedValue(true);
    getCurrenciesMock.mockResolvedValue([]);
    createCurrencyMock.mockResolvedValue({
      id: "conf",
      name: "CONF",
      exchangeValue: 100,
      imageKey: "currencies-conf.png",
      protectedFromOfficialImport: true,
    });
    const { POST } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        name: "CONF",
        exchangeValue: 100,
        imageKey: "currencies-conf.png",
      })
    );
    expect(response.status).toBe(201);
    expect(createCurrencyMock).toHaveBeenCalledWith({
      name: "CONF",
      exchangeValue: 100,
      imageKey: "currencies-conf.png",
      protectedFromOfficialImport: true,
    });
  });

  it("POST returns 409 when the name case-folds to an existing CONF", async () => {
    userIsSuperAdminMock.mockResolvedValue(true);
    getCurrenciesMock.mockResolvedValue([{ id: "conf", name: "CONF" }]);
    const { POST } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        name: " conf ",
        exchangeValue: 100,
        imageKey: "currencies-conf.png",
      })
    );
    expect(response.status).toBe(409);
    expect(createCurrencyMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when a new CONF currency is not named CONF at exchange value 100", async () => {
    userIsSuperAdminMock.mockResolvedValue(true);
    getCurrenciesMock.mockResolvedValue([]);
    const { POST } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        name: "conf",
        exchangeValue: 100,
        imageKey: "currencies-conf.png",
      })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "CONF's name and exchange value cannot be changed",
    });
    expect(createCurrencyMock).not.toHaveBeenCalled();
  });

  it("POST returns 409 when Prisma reports an exact Official name conflict", async () => {
    userIsSuperAdminMock.mockResolvedValue(true);
    getCurrenciesMock.mockResolvedValue([]);
    const { Prisma } = await import("@prisma/client");
    createCurrencyMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "test",
      } as never)
    );
    const { POST } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(POST, makeAuthedRequest(newCurrency));
    expect(response.status).toBe(409);
    expect(touchStaffCatalogueDrift).not.toHaveBeenCalled();
  });

  it("POST returns 500 when creating a currency fails", async () => {
    userIsSuperAdminMock.mockResolvedValue(true);
    getCurrenciesMock.mockResolvedValue([]);
    createCurrencyMock.mockRejectedValue(new Error("db down"));
    const { POST } = await import("@/app/api/currencies/route");
    const response = await invokeRoute(POST, makeAuthedRequest(newCurrency));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      message: "Error creating currency",
    });
  });
});
