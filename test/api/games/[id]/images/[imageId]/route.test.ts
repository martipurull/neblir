import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();
const getGameImageByIdMock = vi.fn();
const deleteGameImageMock = vi.fn();
const s3SendMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/gameImage", () => ({
  getGameImageById: getGameImageByIdMock,
  deleteGameImage: deleteGameImageMock,
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: s3SendMock,
  })),
  DeleteObjectCommand: vi.fn().mockImplementation(() => ({})),
  PutObjectCommand: vi.fn().mockImplementation(() => ({})),
}));

describe("DELETE /api/games/[id]/images/[imageId]", () => {
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
    const { DELETE } = await import(
      "@/app/api/games/[id]/images/[imageId]/route"
    );
    const response = await invokeRoute(
      DELETE,
      makeUnauthedRequest(),
      makeParams({ id: "g-1", imageId: "img-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when requester is not GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { DELETE } = await import(
      "@/app/api/games/[id]/images/[imageId]/route"
    );
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "u-1"),
      makeParams({ id: "g-1", imageId: "img-1" })
    );
    expect(response.status).toBe(403);
  });

  it("deletes game image for GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameImageByIdMock.mockResolvedValue({
      id: "img-1",
      gameId: "g-1",
      imageKey: "games-ref-1.png",
    });
    const { DELETE } = await import(
      "@/app/api/games/[id]/images/[imageId]/route"
    );
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1", imageId: "img-1" })
    );
    expect(response.status).toBe(204);
    expect(deleteGameImageMock).toHaveBeenCalledWith("img-1");
  });
});
