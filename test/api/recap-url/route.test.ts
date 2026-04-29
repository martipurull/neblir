import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const getGameRecapByIdMock = vi.fn();
const userIsInGameMock = vi.fn();
const getSignedUrlMock = vi.fn();

vi.mock("@/app/lib/prisma/gameRecap", () => ({
  getGameRecapById: getGameRecapByIdMock,
}));

vi.mock("@/app/lib/prisma/game", () => ({
  userIsInGame: userIsInGameMock,
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: getSignedUrlMock,
}));

function makeRequest(recapId?: string, authed = true) {
  const base = authed ? makeAuthedRequest() : makeUnauthedRequest();
  return {
    ...base,
    nextUrl: {
      searchParams: new URLSearchParams(
        recapId ? `recapId=${encodeURIComponent(recapId)}` : ""
      ),
    },
  } as any;
}

describe("GET /api/recap-url", () => {
  const envBackup = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...envBackup };
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/recap-url/route");
    const response = await invokeRoute(GET, makeRequest("r-1", false));
    expect(response.status).toBe(401);
  });

  it("returns 404 when recap is not found", async () => {
    getGameRecapByIdMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/recap-url/route");
    const response = await invokeRoute(GET, makeRequest("r-1"));
    expect(response.status).toBe(404);
  });

  it("returns 403 when user is not in game", async () => {
    getGameRecapByIdMock.mockResolvedValue({
      id: "r-1",
      gameId: "g-1",
      fileKey: "recaps-s1.pdf",
      fileName: "s1.pdf",
    });
    userIsInGameMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/recap-url/route");
    const response = await invokeRoute(GET, makeRequest("r-1"));
    expect(response.status).toBe(403);
  });

  it("returns signed url for members", async () => {
    getGameRecapByIdMock.mockResolvedValue({
      id: "r-1",
      gameId: "g-1",
      fileKey: "recaps-s1.pdf",
      fileName: "s1.pdf",
    });
    userIsInGameMock.mockResolvedValue(true);
    getSignedUrlMock.mockResolvedValue("https://signed.example/url");
    const { GET } = await import("@/app/api/recap-url/route");
    const response = await invokeRoute(GET, makeRequest("r-1"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: "https://signed.example/url",
    });
    expect(getSignedUrlMock).toHaveBeenCalledTimes(1);
  });
});
