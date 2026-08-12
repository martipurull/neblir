import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();
const getGameRecapByIdMock = vi.fn();
const updateGameRecapMock = vi.fn();
const deleteGameRecapMock = vi.fn();
const s3SendMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/gameRecap", () => ({
  getGameRecapById: getGameRecapByIdMock,
  updateGameRecap: updateGameRecapMock,
  deleteGameRecap: deleteGameRecapMock,
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
  isDeletableUploadKey: vi.fn((key: string) => key.startsWith("recaps-")),
}));

const existingRecap = {
  id: "r-1",
  gameId: "g-1",
  title: "Session 1",
  summary: "Old summary",
  fileKey: "recaps-old.pdf",
  fileName: "old.pdf",
  fileSizeBytes: 1000,
  uploadedByUserId: "gm-1",
};

describe("PATCH /api/games/[id]/recaps/[recapId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";
    s3SendMock.mockResolvedValue({ ContentLength: 2000 });
  });

  it("returns 401 when unauthenticated", async () => {
    const { PATCH } =
      await import("@/app/api/games/[id]/recaps/[recapId]/route");
    const response = await invokeRoute(
      PATCH,
      makeUnauthedRequest({ title: "Updated" }),
      makeParams({ id: "g-1", recapId: "r-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when game does not exist", async () => {
    getGameMock.mockResolvedValue(null);
    const { PATCH } =
      await import("@/app/api/games/[id]/recaps/[recapId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ title: "Updated" }, "gm-1"),
      makeParams({ id: "g-1", recapId: "r-1" })
    );
    expect(response.status).toBe(404);
    expect(updateGameRecapMock).not.toHaveBeenCalled();
  });

  it("returns 403 when requester is not GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { PATCH } =
      await import("@/app/api/games/[id]/recaps/[recapId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ title: "Updated" }, "u-2"),
      makeParams({ id: "g-1", recapId: "r-1" })
    );
    expect(response.status).toBe(403);
    expect(updateGameRecapMock).not.toHaveBeenCalled();
  });

  it("returns 404 when recap does not belong to the game", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameRecapByIdMock.mockResolvedValue({
      ...existingRecap,
      gameId: "other-game",
    });
    const { PATCH } =
      await import("@/app/api/games/[id]/recaps/[recapId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ title: "Updated" }, "gm-1"),
      makeParams({ id: "g-1", recapId: "r-1" })
    );
    expect(response.status).toBe(404);
    expect(updateGameRecapMock).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid body", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameRecapByIdMock.mockResolvedValue(existingRecap);
    const { PATCH } =
      await import("@/app/api/games/[id]/recaps/[recapId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ title: "" }, "gm-1"),
      makeParams({ id: "g-1", recapId: "r-1" })
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { message: string };
    expect(body.message).toContain("Invalid recap data");
    expect(updateGameRecapMock).not.toHaveBeenCalled();
  });

  it("returns 400 when only some file fields are provided", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameRecapByIdMock.mockResolvedValue(existingRecap);
    const { PATCH } =
      await import("@/app/api/games/[id]/recaps/[recapId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        {
          title: "Updated",
          fileKey: "recaps-new.pdf",
        },
        "gm-1"
      ),
      makeParams({ id: "g-1", recapId: "r-1" })
    );
    expect(response.status).toBe(400);
    expect(updateGameRecapMock).not.toHaveBeenCalled();
  });

  it("updates metadata without replacing the PDF", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameRecapByIdMock.mockResolvedValue(existingRecap);
    updateGameRecapMock.mockResolvedValue({
      ...existingRecap,
      title: "Updated title",
      summary: "New summary",
    });
    const { PATCH } =
      await import("@/app/api/games/[id]/recaps/[recapId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        {
          title: "Updated title",
          summary: "New summary",
        },
        "gm-1"
      ),
      makeParams({ id: "g-1", recapId: "r-1" })
    );
    expect(response.status).toBe(200);
    expect(updateGameRecapMock).toHaveBeenCalledWith("r-1", {
      title: "Updated title",
      summary: "New summary",
    });
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("replaces PDF and deletes the previous object after update", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameRecapByIdMock.mockResolvedValue(existingRecap);
    updateGameRecapMock.mockResolvedValue({
      ...existingRecap,
      title: "Updated title",
      fileKey: "recaps-new.pdf",
      fileName: "new.pdf",
      fileSizeBytes: 2000,
    });
    const { PATCH } =
      await import("@/app/api/games/[id]/recaps/[recapId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        {
          title: "Updated title",
          summary: null,
          fileKey: "recaps-new.pdf",
          fileName: "new.pdf",
          fileSizeBytes: 2000,
        },
        "gm-1"
      ),
      makeParams({ id: "g-1", recapId: "r-1" })
    );
    expect(response.status).toBe(200);
    expect(updateGameRecapMock).toHaveBeenCalledWith("r-1", {
      title: "Updated title",
      summary: null,
      fileKey: "recaps-new.pdf",
      fileName: "new.pdf",
      fileSizeBytes: 2000,
    });
    expect(s3SendMock).toHaveBeenCalledTimes(2);
    expect(s3SendMock.mock.calls[0]?.[0]).toEqual({
      Bucket: "bucket",
      Key: "recaps-new.pdf",
    });
    expect(s3SendMock.mock.calls[1]?.[0]).toEqual({
      Bucket: "bucket",
      Key: "recaps-old.pdf",
    });
  });

  it("returns 400 when replacement PDF is missing from storage", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameRecapByIdMock.mockResolvedValue(existingRecap);
    s3SendMock.mockRejectedValueOnce(new Error("NotFound"));
    const { PATCH } =
      await import("@/app/api/games/[id]/recaps/[recapId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        {
          title: "Updated title",
          fileKey: "recaps-new.pdf",
          fileName: "new.pdf",
          fileSizeBytes: 2000,
        },
        "gm-1"
      ),
      makeParams({ id: "g-1", recapId: "r-1" })
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { message: string };
    expect(body.message).toMatch(/not found/i);
    expect(updateGameRecapMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/games/[id]/recaps/[recapId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";
    s3SendMock.mockResolvedValue({});
  });

  it("returns 401 when unauthenticated", async () => {
    const { DELETE } =
      await import("@/app/api/games/[id]/recaps/[recapId]/route");
    const response = await invokeRoute(
      DELETE,
      makeUnauthedRequest(),
      makeParams({ id: "g-1", recapId: "r-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when requester is not GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { DELETE } =
      await import("@/app/api/games/[id]/recaps/[recapId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "u-2"),
      makeParams({ id: "g-1", recapId: "r-1" })
    );
    expect(response.status).toBe(403);
    expect(deleteGameRecapMock).not.toHaveBeenCalled();
  });

  it("returns 404 when recap is missing", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameRecapByIdMock.mockResolvedValue(null);
    const { DELETE } =
      await import("@/app/api/games/[id]/recaps/[recapId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1", recapId: "r-1" })
    );
    expect(response.status).toBe(404);
    expect(deleteGameRecapMock).not.toHaveBeenCalled();
  });

  it("deletes storage object and recap when requester is GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    getGameRecapByIdMock.mockResolvedValue(existingRecap);
    deleteGameRecapMock.mockResolvedValue(existingRecap);
    const { DELETE } =
      await import("@/app/api/games/[id]/recaps/[recapId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1", recapId: "r-1" })
    );
    expect(response.status).toBe(204);
    expect(s3SendMock).toHaveBeenCalledWith({
      Bucket: "bucket",
      Key: "recaps-old.pdf",
    });
    expect(deleteGameRecapMock).toHaveBeenCalledWith("r-1");
  });
});
