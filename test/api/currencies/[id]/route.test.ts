import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCatalogueR2,
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
  setCatalogueR2,
} from "../../helpers";

const userIsSuperAdminMock = vi.fn();
const getCurrencyMock = vi.fn();
const getCurrenciesMock = vi.fn();
const updateCurrencyMock = vi.fn();
const deleteCurrencyMock = vi.fn();
const countCurrencyHoldingsMock = vi.fn();
const countOfficialRowsWithCatalogueImageKeyMock = vi.fn();
const s3SendMock = vi.fn();
const deleteObjectCommandCtorMock = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(function () {
    return {
      send: s3SendMock,
    };
  }),
  DeleteObjectCommand: vi.fn().mockImplementation(function (args: unknown) {
    deleteObjectCommandCtorMock(args);
    return args;
  }),
}));

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/lib/prisma/characterCurrency", () => ({
  countCurrencyHoldings: countCurrencyHoldingsMock,
}));

vi.mock("@/app/lib/prisma/currency", () => ({
  getCurrency: getCurrencyMock,
  getCurrencies: getCurrenciesMock,
  updateCurrency: updateCurrencyMock,
  deleteCurrency: deleteCurrencyMock,
}));

vi.mock("@/app/lib/prisma/officialCatalogueImage", () => ({
  countOfficialRowsWithCatalogueImageKey:
    countOfficialRowsWithCatalogueImageKeyMock,
}));

const nord = {
  id: "nord",
  name: "NORD",
  imageKey: "currencies-nord.png",
  exchangeValue: 44,
  protectedFromOfficialImport: false,
};

const conf = {
  id: "conf",
  name: "CONF",
  imageKey: "currencies-conf.png",
  exchangeValue: 100,
  protectedFromOfficialImport: false,
};

describe("/api/currencies/[id] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
    countOfficialRowsWithCatalogueImageKeyMock.mockResolvedValue(0);
    s3SendMock.mockResolvedValue({});
    getCurrencyMock.mockResolvedValue(nord);
    getCurrenciesMock.mockResolvedValue([nord, conf]);
    deleteCurrencyMock.mockResolvedValue(nord);
    countCurrencyHoldingsMock.mockResolvedValue(0);
    clearCatalogueR2();
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        GET,
        makeUnauthedRequest(),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when the user is not a super-admin", async () => {
      userIsSuperAdminMock.mockResolvedValue(false);
      const { GET } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 404 when the currency is missing", async () => {
      getCurrencyMock.mockResolvedValue(null);
      const { GET } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 500 when fetching the currency fails", async () => {
      getCurrencyMock.mockRejectedValue(new Error("db down"));
      const { GET } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toMatchObject({
        message: "Error fetching currency",
      });
    });

    it("returns the currency including its exchange value", async () => {
      const { GET } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(nord);
    });
  });

  describe("PATCH", () => {
    it("returns 401 when unauthenticated", async () => {
      const { PATCH } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeUnauthedRequest({ name: "North" }),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(401);
      expect(updateCurrencyMock).not.toHaveBeenCalled();
    });

    it("returns 403 when the user is not a super-admin", async () => {
      userIsSuperAdminMock.mockResolvedValue(false);
      const { PATCH } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "North" }),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(403);
      expect(updateCurrencyMock).not.toHaveBeenCalled();
    });

    it("returns 404 when the currency is missing", async () => {
      getCurrencyMock.mockResolvedValue(null);
      const { PATCH } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "North" }),
        makeParams({ id: "missing" })
      );
      expect(response.status).toBe(404);
      expect(updateCurrencyMock).not.toHaveBeenCalled();
    });

    it("returns 400 when the exchange value is below 1", async () => {
      const { PATCH } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ exchangeValue: 0 }),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(400);
      expect(updateCurrencyMock).not.toHaveBeenCalled();
    });

    it("returns 400 when the exchange value is fractional", async () => {
      const { PATCH } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ exchangeValue: 2.5 }),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(400);
      expect(updateCurrencyMock).not.toHaveBeenCalled();
    });

    it("changes another currency's name, image, and exchange value and raises seed drift", async () => {
      const updated = {
        ...nord,
        name: "North",
        imageKey: "currencies-north.png",
        exchangeValue: 30,
        protectedFromOfficialImport: true,
      };
      updateCurrencyMock.mockResolvedValue(updated);
      const { PATCH } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({
          name: "North",
          imageKey: "currencies-north.png",
          exchangeValue: 30,
        }),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(updated);
      expect(updateCurrencyMock).toHaveBeenCalledWith("nord", {
        name: "North",
        imageKey: "currencies-north.png",
        exchangeValue: 30,
        protectedFromOfficialImport: true,
      });
      expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["currencies"]);
    });

    it("returns 409 when the new name case-folds to CONF", async () => {
      const { PATCH } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: " conf " }),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(409);
      expect(updateCurrencyMock).not.toHaveBeenCalled();
    });

    it("returns 409 when the new Official name matches another currency", async () => {
      getCurrenciesMock.mockResolvedValue([
        nord,
        conf,
        { id: "aaa", name: "AAA" },
      ]);
      const { PATCH } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "  aaa " }),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(409);
      expect(updateCurrencyMock).not.toHaveBeenCalled();
    });

    it("refuses a change to CONF's name", async () => {
      getCurrencyMock.mockResolvedValue(conf);
      const { PATCH } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Credit" }),
        makeParams({ id: "conf" })
      );
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        message: "CONF's name and exchange value cannot be changed",
      });
      expect(updateCurrencyMock).not.toHaveBeenCalled();
    });

    it("refuses a change to CONF's exchange value", async () => {
      getCurrencyMock.mockResolvedValue(conf);
      const { PATCH } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ exchangeValue: 90 }),
        makeParams({ id: "conf" })
      );
      expect(response.status).toBe(400);
      expect(updateCurrencyMock).not.toHaveBeenCalled();
    });

    it("accepts CONF's current name and exchange value together with a new image", async () => {
      getCurrencyMock.mockResolvedValue(conf);
      const updated = {
        ...conf,
        imageKey: "currencies-conf-new.png",
        protectedFromOfficialImport: true,
      };
      updateCurrencyMock.mockResolvedValue(updated);
      const { PATCH } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({
          name: "CONF",
          exchangeValue: 100,
          imageKey: "currencies-conf-new.png",
        }),
        makeParams({ id: "conf" })
      );
      expect(response.status).toBe(200);
      expect(updateCurrencyMock).toHaveBeenCalledWith("conf", {
        name: "CONF",
        exchangeValue: 100,
        imageKey: "currencies-conf-new.png",
        protectedFromOfficialImport: true,
      });
    });

    it("changes CONF's image and leaves the name and exchange value", async () => {
      getCurrencyMock.mockResolvedValue(conf);
      const updated = {
        ...conf,
        imageKey: "currencies-conf-new.png",
        protectedFromOfficialImport: true,
      };
      updateCurrencyMock.mockResolvedValue(updated);
      const { PATCH } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ imageKey: "currencies-conf-new.png" }),
        makeParams({ id: "conf" })
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(updated);
      expect(updateCurrencyMock).toHaveBeenCalledWith("conf", {
        imageKey: "currencies-conf-new.png",
        protectedFromOfficialImport: true,
      });
      expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["currencies"]);
    });

    it("returns 500 when updating a currency fails", async () => {
      updateCurrencyMock.mockRejectedValue(new Error("db down"));
      const { PATCH } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "North" }),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toMatchObject({
        message: "Error updating currency",
      });
    });
  });

  describe("DELETE", () => {
    it("returns 401 when unauthenticated", async () => {
      const { DELETE } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeUnauthedRequest(),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(401);
      expect(deleteCurrencyMock).not.toHaveBeenCalled();
    });

    it("returns 403 when the user is not a super-admin", async () => {
      userIsSuperAdminMock.mockResolvedValue(false);
      const { DELETE } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(403);
      expect(deleteCurrencyMock).not.toHaveBeenCalled();
    });

    it("returns 404 when the currency is missing", async () => {
      getCurrencyMock.mockResolvedValue(null);
      const { DELETE } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(404);
      expect(deleteCurrencyMock).not.toHaveBeenCalled();
    });

    it("returns 500 when deleting the currency fails", async () => {
      deleteCurrencyMock.mockRejectedValue(new Error("db down"));
      const { DELETE } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toMatchObject({
        message: "Error deleting currency",
      });
      expect(touchStaffCatalogueDrift).not.toHaveBeenCalled();
    });

    it("refuses to delete a currency a character holds, and the currency remains", async () => {
      countCurrencyHoldingsMock.mockResolvedValue(2);
      const { DELETE } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({
        message: "A character holds this currency",
      });
      expect(deleteCurrencyMock).not.toHaveBeenCalled();
      expect(touchStaffCatalogueDrift).not.toHaveBeenCalled();
    });

    it("deletes the currency and raises currencies seed drift", async () => {
      const { DELETE } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(204);
      expect(deleteCurrencyMock).toHaveBeenCalledWith("nord");
      expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["currencies"]);
    });

    it("removes an unreferenced catalogue image", async () => {
      setCatalogueR2();
      const { DELETE } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(204);
      expect(deleteObjectCommandCtorMock).toHaveBeenCalledWith({
        Bucket: "neblir-catalogue",
        Key: "currencies-nord.png",
      });
    });

    it("keeps a catalogue image still used by another Official row", async () => {
      setCatalogueR2();
      countOfficialRowsWithCatalogueImageKeyMock.mockResolvedValue(1);
      const { DELETE } = await import("@/app/api/currencies/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "nord" })
      );
      expect(response.status).toBe(204);
      expect(s3SendMock).not.toHaveBeenCalled();
    });
  });
});
