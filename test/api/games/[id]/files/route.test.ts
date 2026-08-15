import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const userIsInGameMock = vi.fn();
const getGameMock = vi.fn();
const getGameFilesMock = vi.fn();
const createGameFileMock = vi.fn();
const s3SendMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  userIsInGame: userIsInGameMock,
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/gameFile", () => ({
  getGameFiles: getGameFilesMock,
  createGameFile: createGameFileMock,
}));

vi.mock("@aws-sdk/client-s3", () => ({
  HeadObjectCommand: vi.fn().mockImplementation(function (args: unknown) {
    return args;
  }),
  S3Client: vi.fn(),
}));

vi.mock("@/app/lib/r2", () => ({
  getR2Config: vi.fn(() => ({
    bucketName: "bucket",
    s3Client: { send: s3SendMock },
  })),
}));

const imageBody = {
  title: "Industrial compound map",
  description: "Map of the industrial compound",
  kind: "IMAGE" as const,
  fileKey: "files-industrial-compound-map-abc.png",
  fileName: "industrial-compound-map.png",
  fileSizeBytes: 1234,
};

const pdfBody = {
  title: "Handout",
  kind: "PDF" as const,
  fileKey: "files-handout-abc.pdf",
  fileName: "handout.pdf",
  fileSizeBytes: 1234,
};

describe("GET /api/games/[id]/files", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/games/[id]/files/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when user is not part of the game", async () => {
    userIsInGameMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/games/[id]/files/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "u-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
    expect(getGameFilesMock).not.toHaveBeenCalled();
  });

  it("returns files for game members", async () => {
    userIsInGameMock.mockResolvedValue(true);
    getGameFilesMock.mockResolvedValue([
      { id: "f-1", title: "Industrial compound map" },
    ]);
    const { GET } = await import("@/app/api/games/[id]/files/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "u-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { id: "f-1", title: "Industrial compound map" },
    ]);
    expect(getGameFilesMock).toHaveBeenCalledWith("g-1");
  });
});

describe("POST /api/games/[id]/files", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    s3SendMock.mockResolvedValue({ ContentLength: 1234 });
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/games/[id]/files/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({}),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when requester is not GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/games/[id]/files/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(imageBody, "u-2"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
    expect(createGameFileMock).not.toHaveBeenCalled();
  });

  it("creates an image file when requester is GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    createGameFileMock.mockResolvedValue({ id: "f-1", ...imageBody });
    const { POST } = await import("@/app/api/games/[id]/files/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(imageBody, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(createGameFileMock).toHaveBeenCalledWith({
      gameId: "g-1",
      title: "Industrial compound map",
      description: "Map of the industrial compound",
      kind: "IMAGE",
      fileKey: "files-industrial-compound-map-abc.png",
      fileName: "industrial-compound-map.png",
      fileSizeBytes: 1234,
      uploadedByUserId: "gm-1",
    });
  });

  it("creates a PDF file when requester is GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    createGameFileMock.mockResolvedValue({ id: "f-2", ...pdfBody });
    const { POST } = await import("@/app/api/games/[id]/files/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(pdfBody, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(createGameFileMock).toHaveBeenCalledWith({
      gameId: "g-1",
      title: "Handout",
      description: null,
      kind: "PDF",
      fileKey: "files-handout-abc.pdf",
      fileName: "handout.pdf",
      fileSizeBytes: 1234,
      uploadedByUserId: "gm-1",
    });
  });

  it("returns 400 when kind and file key do not match", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/games/[id]/files/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          ...pdfBody,
          kind: "IMAGE",
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { message: string };
    expect(body.message).toMatch(/file key/i);
    expect(createGameFileMock).not.toHaveBeenCalled();
  });

  it("returns 400 when uploaded file is missing from storage", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    s3SendMock.mockRejectedValueOnce(new Error("NotFound"));
    const { POST } = await import("@/app/api/games/[id]/files/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(pdfBody, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(createGameFileMock).not.toHaveBeenCalled();
  });
});
