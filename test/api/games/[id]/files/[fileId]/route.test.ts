import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();
const getGameFileByIdMock = vi.fn();
const deleteGameFileMock = vi.fn();
const s3SendMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/gameFile", () => ({
  getGameFileById: getGameFileByIdMock,
  deleteGameFile: deleteGameFileMock,
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(function () {
    return {
      send: s3SendMock,
    };
  }),
  DeleteObjectCommand: vi.fn().mockImplementation(function (args: unknown) {
    return args;
  }),
  PutObjectCommand: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

describe("DELETE /api/games/[id]/files/[fileId]", () => {
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
    const { DELETE } =
      await import("@/app/api/games/[id]/files/[fileId]/route");
    const response = await invokeRoute(
      DELETE,
      makeUnauthedRequest(),
      makeParams({ id: "g-1", fileId: "f-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when requester is not GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { DELETE } =
      await import("@/app/api/games/[id]/files/[fileId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "u-1"),
      makeParams({ id: "g-1", fileId: "f-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 404 when file does not belong to the game", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameFileByIdMock.mockResolvedValue({
      id: "f-1",
      gameId: "other",
      fileKey: "files-citadel.png",
    });
    const { DELETE } =
      await import("@/app/api/games/[id]/files/[fileId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1", fileId: "f-1" })
    );
    expect(response.status).toBe(404);
    expect(deleteGameFileMock).not.toHaveBeenCalled();
  });

  it("deletes game file for GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameFileByIdMock.mockResolvedValue({
      id: "f-1",
      gameId: "g-1",
      fileKey: "files-citadel-abc.png",
    });
    const { DELETE } =
      await import("@/app/api/games/[id]/files/[fileId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1", fileId: "f-1" })
    );
    expect(response.status).toBe(204);
    expect(deleteGameFileMock).toHaveBeenCalledWith("f-1");
  });
});
