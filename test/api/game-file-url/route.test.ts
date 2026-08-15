import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const getGameFileByIdMock = vi.fn();
const userIsInGameMock = vi.fn();
const getSignedUrlMock = vi.fn();
const getObjectCommandCtorMock = vi.fn();

vi.mock("@/app/lib/prisma/gameFile", () => ({
  getGameFileById: getGameFileByIdMock,
}));

vi.mock("@/app/lib/prisma/game", () => ({
  userIsInGame: userIsInGameMock,
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: getSignedUrlMock,
}));

vi.mock("@aws-sdk/client-s3", () => ({
  GetObjectCommand: vi.fn().mockImplementation(function (args: unknown) {
    getObjectCommandCtorMock(args);
    return args;
  }),
  S3Client: vi.fn(),
}));

function makeRequest(
  fileId?: string,
  authed = true,
  extra?: Record<string, string>
) {
  const base = authed ? makeAuthedRequest() : makeUnauthedRequest();
  const searchParams = new URLSearchParams(
    fileId ? `fileId=${encodeURIComponent(fileId)}` : ""
  );
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      searchParams.set(key, value);
    }
  }
  return {
    ...base,
    nextUrl: { searchParams },
  } as any;
}

describe("GET /api/game-file-url", () => {
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
    const { GET } = await import("@/app/api/game-file-url/route");
    const response = await invokeRoute(GET, makeRequest("f-1", false));
    expect(response.status).toBe(401);
  });

  it("returns 404 when file is not found", async () => {
    getGameFileByIdMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/game-file-url/route");
    const response = await invokeRoute(GET, makeRequest("f-1"));
    expect(response.status).toBe(404);
  });

  it("returns 403 when user is not in game", async () => {
    getGameFileByIdMock.mockResolvedValue({
      id: "f-1",
      gameId: "g-1",
      kind: "PDF",
      fileKey: "files-handout.pdf",
      fileName: "handout.pdf",
    });
    userIsInGameMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/game-file-url/route");
    const response = await invokeRoute(GET, makeRequest("f-1"));
    expect(response.status).toBe(403);
  });

  it("returns a signed inline url for PDF members", async () => {
    getGameFileByIdMock.mockResolvedValue({
      id: "f-1",
      gameId: "g-1",
      kind: "PDF",
      fileKey: "files-handout.pdf",
      fileName: "handout.pdf",
    });
    userIsInGameMock.mockResolvedValue(true);
    getSignedUrlMock.mockResolvedValue("https://signed.example/pdf");
    const { GET } = await import("@/app/api/game-file-url/route");
    const response = await invokeRoute(GET, makeRequest("f-1"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: "https://signed.example/pdf",
    });
    expect(getObjectCommandCtorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ResponseContentType: "application/pdf",
        ResponseContentDisposition: expect.stringContaining("inline"),
      })
    );
  });

  it("returns a signed inline url for image members", async () => {
    getGameFileByIdMock.mockResolvedValue({
      id: "f-2",
      gameId: "g-1",
      kind: "IMAGE",
      fileKey: "files-citadel.png",
      fileName: "citadel.png",
    });
    userIsInGameMock.mockResolvedValue(true);
    getSignedUrlMock.mockResolvedValue("https://signed.example/img");
    const { GET } = await import("@/app/api/game-file-url/route");
    const response = await invokeRoute(GET, makeRequest("f-2"));
    expect(response.status).toBe(200);
    expect(getObjectCommandCtorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ResponseContentType: "image/png",
        ResponseContentDisposition: expect.stringContaining("inline"),
      })
    );
  });

  it("returns a signed attachment url when disposition=attachment", async () => {
    getGameFileByIdMock.mockResolvedValue({
      id: "f-1",
      gameId: "g-1",
      kind: "PDF",
      fileKey: "files-handout.pdf",
      fileName: "handout.pdf",
    });
    userIsInGameMock.mockResolvedValue(true);
    getSignedUrlMock.mockResolvedValue("https://signed.example/pdf");
    const { GET } = await import("@/app/api/game-file-url/route");
    const response = await invokeRoute(
      GET,
      makeRequest("f-1", true, { disposition: "attachment" })
    );
    expect(response.status).toBe(200);
    expect(getObjectCommandCtorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ResponseContentDisposition: expect.stringContaining("attachment"),
      })
    );
  });
});
