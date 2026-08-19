import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const getGameMock = vi.fn();
const getSignedUrlMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: getSignedUrlMock,
}));

describe("POST /api/game-file-upload-url", () => {
  const envBackup = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...envBackup };
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";
    getSignedUrlMock.mockResolvedValue("https://r2.example/upload");
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/game-file-upload-url/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({
        gameId: "g-1",
        fileName: "handout.pdf",
        fileSizeBytes: 1234,
        kind: "PDF",
      })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when requester is not GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/game-file-upload-url/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "g-1",
          fileName: "handout.pdf",
          fileSizeBytes: 1234,
          kind: "PDF",
        },
        "u-2"
      )
    );
    expect(response.status).toBe(403);
  });

  it("returns 400 for non-pdf file names", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/game-file-upload-url/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "g-1",
          fileName: "handout.png",
          fileSizeBytes: 1234,
          kind: "PDF",
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(400);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });

  it("returns 400 when file exceeds 50MB", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/game-file-upload-url/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "g-1",
          fileName: "handout.pdf",
          fileSizeBytes: 50 * 1024 * 1024 + 1,
          kind: "PDF",
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(400);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });

  it("returns presigned upload url and files- pdf key for GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/game-file-upload-url/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "g-1",
          fileName: "Session Map.pdf",
          fileSizeBytes: 2048,
          kind: "PDF",
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.uploadUrl).toBe("https://r2.example/upload");
    expect(body.fileKey).toMatch(/^files-/);
    expect(body.fileKey).toMatch(/\.pdf$/);
  });
});
