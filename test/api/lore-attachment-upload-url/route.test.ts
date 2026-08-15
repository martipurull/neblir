import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const getGameMock = vi.fn();
const getReferenceEntryMock = vi.fn();
const getSignedUrlMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/referenceEntry", () => ({
  getReferenceEntry: getReferenceEntryMock,
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: getSignedUrlMock,
}));

describe("POST /api/lore-attachment-upload-url", () => {
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
    const { POST } = await import("@/app/api/lore-attachment-upload-url/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({
        gameId: "g-1",
        fileName: "map.pdf",
        fileSizeBytes: 1234,
      })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when requester is not GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/lore-attachment-upload-url/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "g-1",
          fileName: "map.pdf",
          fileSizeBytes: 1234,
        },
        "u-2"
      )
    );
    expect(response.status).toBe(403);
  });

  it("returns 400 for a non-lore reference entry", async () => {
    getReferenceEntryMock.mockResolvedValue({
      id: "r-1",
      category: "WORLD",
      gameId: "g-1",
    });
    const { POST } = await import("@/app/api/lore-attachment-upload-url/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          referenceEntryId: "r-1",
          fileName: "map.pdf",
          fileSizeBytes: 1234,
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(400);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });

  it("returns 400 when neither gameId nor referenceEntryId is provided", async () => {
    const { POST } = await import("@/app/api/lore-attachment-upload-url/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          fileName: "map.pdf",
          fileSizeBytes: 1234,
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(400);
  });

  it("returns a lore- pdf key for GM using gameId", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/lore-attachment-upload-url/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "g-1",
          fileName: "City Map.pdf",
          fileSizeBytes: 2048,
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.fileKey).toMatch(/^lore-/);
    expect(body.fileKey).toMatch(/\.pdf$/);
  });

  it("returns a lore- image key for GM using gameId", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/lore-attachment-upload-url/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "g-1",
          fileName: "Faction crest.png",
          fileSizeBytes: 2048,
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.fileKey).toMatch(/^lore-/);
    expect(body.fileKey).toMatch(/\.png$/);
  });

  it("returns 400 for an unsupported lore attachment type", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/lore-attachment-upload-url/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "g-1",
          fileName: "notes.txt",
          fileSizeBytes: 2048,
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(400);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });

  it("returns 400 when an image is larger than the image limit", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/lore-attachment-upload-url/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "g-1",
          fileName: "crest.png",
          fileSizeBytes: 6 * 1024 * 1024,
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(400);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });
});
