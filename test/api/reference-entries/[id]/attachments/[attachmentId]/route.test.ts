import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getReferenceEntryMock = vi.fn();
const canWriteGameScopedReferenceEntryMock = vi.fn();
const getReferenceEntryAttachmentByIdMock = vi.fn();
const deleteReferenceEntryAttachmentMock = vi.fn();
const s3SendMock = vi.fn();

vi.mock("@/app/lib/prisma/referenceEntry", () => ({
  getReferenceEntry: getReferenceEntryMock,
}));

vi.mock("@/app/lib/authz/referenceEntry", () => ({
  canWriteGameScopedReferenceEntry: canWriteGameScopedReferenceEntryMock,
}));

vi.mock("@/app/lib/prisma/referenceEntryAttachment", () => ({
  getReferenceEntryAttachmentById: getReferenceEntryAttachmentByIdMock,
  deleteReferenceEntryAttachment: deleteReferenceEntryAttachmentMock,
}));

vi.mock("@aws-sdk/client-s3", () => ({
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
  isDeletableUploadKey: vi.fn((key: string) => key.startsWith("lore-")),
}));

describe("DELETE /api/reference-entries/[id]/attachments/[attachmentId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { DELETE } =
      await import("@/app/api/reference-entries/[id]/attachments/[attachmentId]/route");
    const response = await invokeRoute(
      DELETE,
      makeUnauthedRequest(),
      makeParams({ id: "r-1", attachmentId: "a-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when requester cannot write the entry", async () => {
    getReferenceEntryMock.mockResolvedValue({
      id: "r-1",
      gameId: "g-1",
    });
    canWriteGameScopedReferenceEntryMock.mockResolvedValue(false);
    const { DELETE } =
      await import("@/app/api/reference-entries/[id]/attachments/[attachmentId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "u-1"),
      makeParams({ id: "r-1", attachmentId: "a-1" })
    );
    expect(response.status).toBe(403);
    expect(deleteReferenceEntryAttachmentMock).not.toHaveBeenCalled();
  });

  it("returns 404 when attachment does not belong to the entry", async () => {
    getReferenceEntryMock.mockResolvedValue({ id: "r-1", gameId: "g-1" });
    canWriteGameScopedReferenceEntryMock.mockResolvedValue(true);
    getReferenceEntryAttachmentByIdMock.mockResolvedValue({
      id: "a-1",
      referenceEntryId: "other",
      fileKey: "lore-map.pdf",
    });
    const { DELETE } =
      await import("@/app/api/reference-entries/[id]/attachments/[attachmentId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "r-1", attachmentId: "a-1" })
    );
    expect(response.status).toBe(404);
    expect(deleteReferenceEntryAttachmentMock).not.toHaveBeenCalled();
  });

  it("deletes storage object and attachment for GM", async () => {
    getReferenceEntryMock.mockResolvedValue({ id: "r-1", gameId: "g-1" });
    canWriteGameScopedReferenceEntryMock.mockResolvedValue(true);
    getReferenceEntryAttachmentByIdMock.mockResolvedValue({
      id: "a-1",
      referenceEntryId: "r-1",
      fileKey: "lore-map.pdf",
    });
    const { DELETE } =
      await import("@/app/api/reference-entries/[id]/attachments/[attachmentId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "r-1", attachmentId: "a-1" })
    );
    expect(response.status).toBe(204);
    expect(s3SendMock).toHaveBeenCalledWith({
      Bucket: "bucket",
      Key: "lore-map.pdf",
    });
    expect(deleteReferenceEntryAttachmentMock).toHaveBeenCalledWith("a-1");
  });
});
