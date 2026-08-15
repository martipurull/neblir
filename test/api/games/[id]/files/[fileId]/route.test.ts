import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();
const getGameFileByIdMock = vi.fn();
const updateGameFileMock = vi.fn();
const deleteGameFileMock = vi.fn();
const s3SendMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/gameFile", () => ({
  getGameFileById: getGameFileByIdMock,
  updateGameFile: updateGameFileMock,
  deleteGameFile: deleteGameFileMock,
}));

vi.mock("@aws-sdk/client-s3", () => ({
  HeadObjectCommand: vi.fn().mockImplementation(function (args: unknown) {
    return args;
  }),
  DeleteObjectCommand: vi.fn().mockImplementation(function (args: unknown) {
    return args;
  }),
  S3Client: vi.fn(),
}));

vi.mock("@/app/lib/r2", () => ({
  getR2Config: vi.fn(() => ({
    bucketName: "bucket",
    s3Client: { send: s3SendMock },
  })),
  isDeletableUploadKey: vi.fn((key: string) => key.startsWith("files-")),
}));

const existingFile = {
  id: "f-1",
  gameId: "g-1",
  title: "Industrial compound map",
  description: "Old description",
  kind: "IMAGE" as const,
  access: "PLAYER" as const,
  fileKey: "files-old.png",
  fileName: "old.png",
  fileSizeBytes: 1000,
  uploadedByUserId: "gm-1",
};

describe("PATCH /api/games/[id]/files/[fileId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    s3SendMock.mockResolvedValue({ ContentLength: 2000 });
  });

  it("returns 401 when unauthenticated", async () => {
    const { PATCH } = await import("@/app/api/games/[id]/files/[fileId]/route");
    const response = await invokeRoute(
      PATCH,
      makeUnauthedRequest({ title: "Updated", access: "PLAYER" }),
      makeParams({ id: "g-1", fileId: "f-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when game does not exist", async () => {
    getGameMock.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/games/[id]/files/[fileId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ title: "Updated", access: "PLAYER" }, "gm-1"),
      makeParams({ id: "g-1", fileId: "f-1" })
    );
    expect(response.status).toBe(404);
    expect(updateGameFileMock).not.toHaveBeenCalled();
  });

  it("returns 403 when requester is not GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { PATCH } = await import("@/app/api/games/[id]/files/[fileId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ title: "Updated", access: "PLAYER" }, "u-2"),
      makeParams({ id: "g-1", fileId: "f-1" })
    );
    expect(response.status).toBe(403);
    expect(updateGameFileMock).not.toHaveBeenCalled();
  });

  it("returns 404 when file does not belong to the game", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameFileByIdMock.mockResolvedValue({
      ...existingFile,
      gameId: "other-game",
    });
    const { PATCH } = await import("@/app/api/games/[id]/files/[fileId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ title: "Updated", access: "PLAYER" }, "gm-1"),
      makeParams({ id: "g-1", fileId: "f-1" })
    );
    expect(response.status).toBe(404);
    expect(updateGameFileMock).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid body", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameFileByIdMock.mockResolvedValue(existingFile);
    const { PATCH } = await import("@/app/api/games/[id]/files/[fileId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ title: "", access: "PLAYER" }, "gm-1"),
      makeParams({ id: "g-1", fileId: "f-1" })
    );
    expect(response.status).toBe(400);
    expect(updateGameFileMock).not.toHaveBeenCalled();
  });

  it("returns 400 when only some file fields are provided", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameFileByIdMock.mockResolvedValue(existingFile);
    const { PATCH } = await import("@/app/api/games/[id]/files/[fileId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        {
          title: "Updated",
          access: "PLAYER",
          fileKey: "files-new.pdf",
        },
        "gm-1"
      ),
      makeParams({ id: "g-1", fileId: "f-1" })
    );
    expect(response.status).toBe(400);
    expect(updateGameFileMock).not.toHaveBeenCalled();
  });

  it("updates metadata without replacing the file", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameFileByIdMock.mockResolvedValue(existingFile);
    updateGameFileMock.mockResolvedValue({
      ...existingFile,
      title: "Updated title",
      access: "GAME_MASTER",
    });
    const { PATCH } = await import("@/app/api/games/[id]/files/[fileId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        {
          title: "Updated title",
          description: "New description",
          access: "GAME_MASTER",
        },
        "gm-1"
      ),
      makeParams({ id: "g-1", fileId: "f-1" })
    );
    expect(response.status).toBe(200);
    expect(updateGameFileMock).toHaveBeenCalledWith("f-1", {
      title: "Updated title",
      description: "New description",
      access: "GAME_MASTER",
    });
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("replaces the stored file and deletes the previous object", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameFileByIdMock.mockResolvedValue(existingFile);
    updateGameFileMock.mockResolvedValue({
      ...existingFile,
      kind: "PDF",
      fileKey: "files-handout-abc.pdf",
      fileName: "handout.pdf",
      fileSizeBytes: 2000,
    });
    const { PATCH } = await import("@/app/api/games/[id]/files/[fileId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        {
          title: "Handout",
          access: "PLAYER",
          kind: "PDF",
          fileKey: "files-handout-abc.pdf",
          fileName: "handout.pdf",
          fileSizeBytes: 2000,
        },
        "gm-1"
      ),
      makeParams({ id: "g-1", fileId: "f-1" })
    );
    expect(response.status).toBe(200);
    expect(updateGameFileMock).toHaveBeenCalledWith(
      "f-1",
      expect.objectContaining({
        kind: "PDF",
        fileKey: "files-handout-abc.pdf",
        fileName: "handout.pdf",
        fileSizeBytes: 2000,
      })
    );
    expect(s3SendMock).toHaveBeenCalledTimes(2);
    expect(s3SendMock.mock.calls[0]?.[0]).toEqual({
      Bucket: "bucket",
      Key: "files-handout-abc.pdf",
    });
    expect(s3SendMock.mock.calls[1]?.[0]).toEqual({
      Bucket: "bucket",
      Key: "files-old.png",
    });
  });

  it("returns 400 when replacement file is missing from storage", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameFileByIdMock.mockResolvedValue(existingFile);
    s3SendMock.mockRejectedValueOnce(new Error("NotFound"));
    const { PATCH } = await import("@/app/api/games/[id]/files/[fileId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        {
          title: "Handout",
          access: "PLAYER",
          kind: "PDF",
          fileKey: "files-handout-abc.pdf",
          fileName: "handout.pdf",
          fileSizeBytes: 2000,
        },
        "gm-1"
      ),
      makeParams({ id: "g-1", fileId: "f-1" })
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { message: string };
    expect(body.message).toMatch(/not found/i);
    expect(updateGameFileMock).not.toHaveBeenCalled();
  });

  it("returns 400 when replacement file key does not match kind", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameFileByIdMock.mockResolvedValue(existingFile);
    const { PATCH } = await import("@/app/api/games/[id]/files/[fileId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        {
          title: "Handout",
          access: "PLAYER",
          kind: "PDF",
          fileKey: "files-handout-abc.png",
          fileName: "handout.pdf",
          fileSizeBytes: 2000,
        },
        "gm-1"
      ),
      makeParams({ id: "g-1", fileId: "f-1" })
    );
    expect(response.status).toBe(400);
    expect(updateGameFileMock).not.toHaveBeenCalled();
    expect(s3SendMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/games/[id]/files/[fileId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
