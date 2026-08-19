import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const getReferenceEntryAttachmentByIdMock = vi.fn();
const getReferenceEntryMock = vi.fn();
const canReadReferenceEntryMock = vi.fn();
const getSignedUrlMock = vi.fn();
const getObjectCommandCtorMock = vi.fn();

vi.mock("@/app/lib/prisma/referenceEntryAttachment", () => ({
  getReferenceEntryAttachmentById: getReferenceEntryAttachmentByIdMock,
}));

vi.mock("@/app/lib/prisma/referenceEntry", () => ({
  getReferenceEntry: getReferenceEntryMock,
}));

vi.mock("@/app/lib/authz/referenceEntry", () => ({
  canReadReferenceEntry: canReadReferenceEntryMock,
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
  attachmentId?: string,
  authed = true,
  extra?: Record<string, string>
) {
  const base = authed ? makeAuthedRequest() : makeUnauthedRequest();
  const searchParams = new URLSearchParams(
    attachmentId ? `attachmentId=${encodeURIComponent(attachmentId)}` : ""
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

describe("GET /api/lore-attachment-url", () => {
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
    const { GET } = await import("@/app/api/lore-attachment-url/route");
    const response = await invokeRoute(GET, makeRequest("a-1", false));
    expect(response.status).toBe(401);
  });

  it("returns 404 when attachment is missing", async () => {
    getReferenceEntryAttachmentByIdMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/lore-attachment-url/route");
    const response = await invokeRoute(GET, makeRequest("a-1"));
    expect(response.status).toBe(404);
  });

  it("returns 403 when the user cannot read the parent entry", async () => {
    getReferenceEntryAttachmentByIdMock.mockResolvedValue({
      id: "a-1",
      referenceEntryId: "r-1",
      fileKey: "lore-map.pdf",
      fileName: "map.pdf",
    });
    getReferenceEntryMock.mockResolvedValue({
      id: "r-1",
      gameId: "g-1",
      access: "GAME_MASTER",
    });
    canReadReferenceEntryMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/lore-attachment-url/route");
    const response = await invokeRoute(GET, makeRequest("a-1"));
    expect(response.status).toBe(403);
  });

  it("returns a signed url when the user can read the entry", async () => {
    getReferenceEntryAttachmentByIdMock.mockResolvedValue({
      id: "a-1",
      referenceEntryId: "r-1",
      fileKey: "lore-map.pdf",
      fileName: "map.pdf",
    });
    getReferenceEntryMock.mockResolvedValue({
      id: "r-1",
      gameId: "g-1",
      access: "PLAYER",
    });
    canReadReferenceEntryMock.mockResolvedValue(true);
    getSignedUrlMock.mockResolvedValue("https://signed.example/lore");
    const { GET } = await import("@/app/api/lore-attachment-url/route");
    const response = await invokeRoute(GET, makeRequest("a-1"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: "https://signed.example/lore",
    });
    expect(getObjectCommandCtorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ResponseContentType: "application/pdf",
        ResponseContentDisposition: expect.stringContaining("inline"),
      })
    );
  });

  it("returns a signed attachment url when disposition=attachment", async () => {
    getReferenceEntryAttachmentByIdMock.mockResolvedValue({
      id: "a-1",
      referenceEntryId: "r-1",
      fileKey: "lore-map.pdf",
      fileName: "map.pdf",
    });
    getReferenceEntryMock.mockResolvedValue({
      id: "r-1",
      gameId: "g-1",
      access: "PLAYER",
    });
    canReadReferenceEntryMock.mockResolvedValue(true);
    getSignedUrlMock.mockResolvedValue("https://signed.example/lore");
    const { GET } = await import("@/app/api/lore-attachment-url/route");
    const response = await invokeRoute(
      GET,
      makeRequest("a-1", true, { disposition: "attachment" })
    );
    expect(response.status).toBe(200);
    expect(getObjectCommandCtorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ResponseContentDisposition: expect.stringContaining("attachment"),
      })
    );
  });

  it("returns a signed image url with the image content type", async () => {
    getReferenceEntryAttachmentByIdMock.mockResolvedValue({
      id: "a-2",
      referenceEntryId: "r-1",
      fileKey: "lore-crest.png",
      fileName: "crest.png",
    });
    getReferenceEntryMock.mockResolvedValue({
      id: "r-1",
      gameId: "g-1",
      access: "PLAYER",
    });
    canReadReferenceEntryMock.mockResolvedValue(true);
    getSignedUrlMock.mockResolvedValue("https://signed.example/lore-img");
    const { GET } = await import("@/app/api/lore-attachment-url/route");
    const response = await invokeRoute(GET, makeRequest("a-2"));
    expect(response.status).toBe(200);
    expect(getObjectCommandCtorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ResponseContentType: "image/png",
        ResponseContentDisposition: expect.stringContaining("inline"),
      })
    );
  });
});
