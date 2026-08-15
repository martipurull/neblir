import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getReferenceEntryMock = vi.fn();
const canReadReferenceEntryMock = vi.fn();
const canWriteGameScopedReferenceEntryMock = vi.fn();
const getReferenceEntryAttachmentsMock = vi.fn();
const createReferenceEntryAttachmentMock = vi.fn();
const s3SendMock = vi.fn();

vi.mock("@/app/lib/prisma/referenceEntry", () => ({
  getReferenceEntry: getReferenceEntryMock,
}));

vi.mock("@/app/lib/authz/referenceEntry", () => ({
  canReadReferenceEntry: canReadReferenceEntryMock,
  canWriteGameScopedReferenceEntry: canWriteGameScopedReferenceEntryMock,
}));

vi.mock("@/app/lib/prisma/referenceEntryAttachment", () => ({
  getReferenceEntryAttachments: getReferenceEntryAttachmentsMock,
  createReferenceEntryAttachment: createReferenceEntryAttachmentMock,
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

const loreEntry = {
  id: "r-1",
  category: "CAMPAIGN_LORE",
  gameId: "g-1",
  access: "PLAYER",
};

const attachmentBody = {
  fileKey: "lore-map-abc.pdf",
  fileName: "map.pdf",
  fileSizeBytes: 1234,
};

describe("GET /api/reference-entries/[id]/attachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } =
      await import("@/app/api/reference-entries/[id]/attachments/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "r-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when the user cannot read the entry", async () => {
    getReferenceEntryMock.mockResolvedValue({
      ...loreEntry,
      access: "GAME_MASTER",
    });
    canReadReferenceEntryMock.mockResolvedValue(false);
    const { GET } =
      await import("@/app/api/reference-entries/[id]/attachments/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "u-1"),
      makeParams({ id: "r-1" })
    );
    expect(response.status).toBe(403);
    expect(getReferenceEntryAttachmentsMock).not.toHaveBeenCalled();
  });

  it("returns attachments when the user can read the entry", async () => {
    getReferenceEntryMock.mockResolvedValue(loreEntry);
    canReadReferenceEntryMock.mockResolvedValue(true);
    getReferenceEntryAttachmentsMock.mockResolvedValue([
      { id: "a-1", fileName: "map.pdf" },
    ]);
    const { GET } =
      await import("@/app/api/reference-entries/[id]/attachments/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "u-1"),
      makeParams({ id: "r-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: "a-1", fileName: "map.pdf" }]);
  });
});

describe("POST /api/reference-entries/[id]/attachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    s3SendMock.mockResolvedValue({ ContentLength: 1234 });
  });

  it("returns 403 when requester cannot write the entry", async () => {
    getReferenceEntryMock.mockResolvedValue(loreEntry);
    canWriteGameScopedReferenceEntryMock.mockResolvedValue(false);
    const { POST } =
      await import("@/app/api/reference-entries/[id]/attachments/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(attachmentBody, "u-1"),
      makeParams({ id: "r-1" })
    );
    expect(response.status).toBe(403);
    expect(createReferenceEntryAttachmentMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-lore entry", async () => {
    getReferenceEntryMock.mockResolvedValue({
      id: "r-1",
      category: "WORLD",
      gameId: null,
    });
    const { POST } =
      await import("@/app/api/reference-entries/[id]/attachments/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(attachmentBody, "gm-1"),
      makeParams({ id: "r-1" })
    );
    expect(response.status).toBe(400);
    expect(createReferenceEntryAttachmentMock).not.toHaveBeenCalled();
  });

  it("creates an attachment when requester is GM", async () => {
    getReferenceEntryMock.mockResolvedValue(loreEntry);
    canWriteGameScopedReferenceEntryMock.mockResolvedValue(true);
    createReferenceEntryAttachmentMock.mockResolvedValue({
      id: "a-1",
      ...attachmentBody,
    });
    const { POST } =
      await import("@/app/api/reference-entries/[id]/attachments/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(attachmentBody, "gm-1"),
      makeParams({ id: "r-1" })
    );
    expect(response.status).toBe(201);
    expect(createReferenceEntryAttachmentMock).toHaveBeenCalledWith({
      referenceEntryId: "r-1",
      fileKey: "lore-map-abc.pdf",
      fileName: "map.pdf",
      fileSizeBytes: 1234,
      uploadedByUserId: "gm-1",
    });
  });

  it("creates an image attachment when requester is GM", async () => {
    const imageBody = {
      fileKey: "lore-crest-abc.png",
      fileName: "crest.png",
      fileSizeBytes: 1234,
    };
    getReferenceEntryMock.mockResolvedValue(loreEntry);
    canWriteGameScopedReferenceEntryMock.mockResolvedValue(true);
    createReferenceEntryAttachmentMock.mockResolvedValue({
      id: "a-2",
      ...imageBody,
    });
    const { POST } =
      await import("@/app/api/reference-entries/[id]/attachments/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(imageBody, "gm-1"),
      makeParams({ id: "r-1" })
    );
    expect(response.status).toBe(201);
    expect(createReferenceEntryAttachmentMock).toHaveBeenCalledWith({
      referenceEntryId: "r-1",
      fileKey: "lore-crest-abc.png",
      fileName: "crest.png",
      fileSizeBytes: 1234,
      uploadedByUserId: "gm-1",
    });
  });

  it("returns 400 for an invalid lore file key", async () => {
    getReferenceEntryMock.mockResolvedValue(loreEntry);
    canWriteGameScopedReferenceEntryMock.mockResolvedValue(true);
    const { POST } =
      await import("@/app/api/reference-entries/[id]/attachments/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          ...attachmentBody,
          fileKey: "files-map.pdf",
        },
        "gm-1"
      ),
      makeParams({ id: "r-1" })
    );
    expect(response.status).toBe(400);
    expect(createReferenceEntryAttachmentMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the file key kind does not match the file name", async () => {
    getReferenceEntryMock.mockResolvedValue(loreEntry);
    canWriteGameScopedReferenceEntryMock.mockResolvedValue(true);
    const { POST } =
      await import("@/app/api/reference-entries/[id]/attachments/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          fileKey: "lore-map-abc.pdf",
          fileName: "crest.png",
          fileSizeBytes: 1234,
        },
        "gm-1"
      ),
      makeParams({ id: "r-1" })
    );
    expect(response.status).toBe(400);
    expect(createReferenceEntryAttachmentMock).not.toHaveBeenCalled();
  });
});
