import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const s3SendMock = vi.fn();
const putObjectCommandCtorMock = vi.fn();
const deleteObjectCommandCtorMock = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: s3SendMock,
  })),
  PutObjectCommand: vi.fn().mockImplementation((args: unknown) => {
    putObjectCommandCtorMock(args);
    return {};
  }),
  DeleteObjectCommand: vi.fn().mockImplementation((args: unknown) => {
    deleteObjectCommandCtorMock(args);
    return {};
  }),
}));

function makeUploadRequest(options: {
  type?: string;
  file?: File | null;
  authenticated?: boolean;
  userId?: string;
}) {
  const {
    type = "custom_items",
    file = null,
    authenticated = true,
    userId = "user-1",
  } = options;
  const formData = new FormData();
  if (file) formData.set("file", file);

  const base = authenticated
    ? makeAuthedRequest(undefined, userId)
    : makeUnauthedRequest();

  return {
    ...base,
    formData: () => Promise.resolve(formData),
    nextUrl: {
      searchParams: new URLSearchParams(
        type ? `type=${encodeURIComponent(type)}` : ""
      ),
    },
  } as any;
}

function makeDeleteRequest(options: {
  imageKey?: string;
  authenticated?: boolean;
  userId?: string;
}) {
  const { imageKey, authenticated = true, userId = "user-1" } = options;
  const base = authenticated
    ? makeAuthedRequest(undefined, userId)
    : makeUnauthedRequest();

  return {
    ...base,
    nextUrl: {
      searchParams: new URLSearchParams(
        imageKey != null ? `imageKey=${encodeURIComponent(imageKey)}` : ""
      ),
    },
  } as any;
}

describe("/api/upload-image POST", () => {
  const envBackup = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...envBackup };
    s3SendMock.mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    const file = new File(["x"], "test.png", { type: "image/png" });
    const { POST } = await import("@/app/api/upload-image/route");
    const request = makeUploadRequest({ file, authenticated: false });
    const response = await invokeRoute(POST, request);
    expect(response.status).toBe(401);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("returns 400 when type is missing", async () => {
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";

    const file = new File(["x"], "test.png", { type: "image/png" });
    const { POST } = await import("@/app/api/upload-image/route");
    const request = makeUploadRequest({ file });
    request.nextUrl.searchParams = new URLSearchParams("");
    const response = await invokeRoute(POST, request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toMatch(/type/);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("returns 400 when type is invalid", async () => {
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";

    const file = new File(["x"], "test.png", { type: "image/png" });
    const { POST } = await import("@/app/api/upload-image/route");
    const request = makeUploadRequest({ file, type: "invalid_type" });
    const response = await invokeRoute(POST, request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toMatch(/custom_items|unique_items/);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("returns 500 when R2 credentials are missing", async () => {
    delete process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY;
    delete process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY;

    const file = new File(["x"], "test.png", { type: "image/png" });
    const { POST } = await import("@/app/api/upload-image/route");
    const request = makeUploadRequest({ file });
    const response = await invokeRoute(POST, request);
    expect(response.status).toBe(500);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("returns 400 when file is missing", async () => {
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";

    const { POST } = await import("@/app/api/upload-image/route");
    const request = makeUploadRequest({ file: null });
    const response = await invokeRoute(POST, request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toMatch(/Missing|invalid|file/i);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("returns 400 when file exceeds 5MB", async () => {
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";

    const size = 5 * 1024 * 1024 + 1;
    const file = new File(["x".repeat(size)], "big.png", { type: "image/png" });
    const { POST } = await import("@/app/api/upload-image/route");
    const request = makeUploadRequest({ file });
    const response = await invokeRoute(POST, request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toMatch(/5MB|smaller/i);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("returns 201 with imageKey and uploads with correct key pattern for custom_items", async () => {
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";

    const file = new File(["x"], "My Item.png", { type: "image/png" });
    const { POST } = await import("@/app/api/upload-image/route");
    const request = makeUploadRequest({ file, type: "custom_items" });
    const response = await invokeRoute(POST, request);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty("imageKey");
    expect(data.imageKey).toMatch(/^custom_items-/);
    expect(data.imageKey).toMatch(/\.png$/);
    expect(data.imageKey).toMatch(/my_item.*\.png$/);

    expect(s3SendMock).toHaveBeenCalledTimes(1);
    expect(putObjectCommandCtorMock).toHaveBeenCalledTimes(1);
    const putArgs = putObjectCommandCtorMock.mock.calls[0][0];
    expect(putArgs.Bucket).toBe("bucket");
    expect(putArgs.Key).toBe(data.imageKey);
    expect(putArgs.ContentType).toMatch(/image\/png/);
  });

  it("returns 201 with imageKey for unique_items type", async () => {
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";

    const file = new File(["x"], "variant.jpeg", { type: "image/jpeg" });
    const { POST } = await import("@/app/api/upload-image/route");
    const request = makeUploadRequest({ file, type: "unique_items" });
    const response = await invokeRoute(POST, request);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.imageKey).toMatch(/^unique_items-/);
    expect(data.imageKey).toMatch(/\.jpeg$/);

    const putArgs = putObjectCommandCtorMock.mock.calls[0][0];
    expect(putArgs.Key).toBe(data.imageKey);
  });
});

describe("/api/upload-image DELETE", () => {
  const envBackup = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...envBackup };
    s3SendMock.mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    const { DELETE } = await import("@/app/api/upload-image/route");
    const request = makeDeleteRequest({
      imageKey: "custom_items-some_key-abc.png",
      authenticated: false,
    });
    const response = await invokeRoute(DELETE, request);
    expect(response.status).toBe(401);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("returns 400 when imageKey is missing", async () => {
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";

    const { DELETE } = await import("@/app/api/upload-image/route");
    const request = makeDeleteRequest({});
    const response = await invokeRoute(DELETE, request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toMatch(/imageKey/i);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("returns 204 when imageKey is characters- prefixed", async () => {
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";

    const { DELETE } = await import("@/app/api/upload-image/route");
    const request = makeDeleteRequest({
      imageKey: "characters-alexandra.png",
    });
    const response = await invokeRoute(DELETE, request);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(s3SendMock).toHaveBeenCalledTimes(1);
    expect(deleteObjectCommandCtorMock).toHaveBeenCalledTimes(1);
    const deleteArgs = deleteObjectCommandCtorMock.mock.calls[0][0];
    expect(deleteArgs.Bucket).toBe("bucket");
    expect(deleteArgs.Key).toBe("characters-alexandra.png");
  });

  it("returns 204 when imageKey is games- prefixed", async () => {
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";

    const { DELETE } = await import("@/app/api/upload-image/route");
    const request = makeDeleteRequest({
      imageKey: "games-cover.png",
    });
    const response = await invokeRoute(DELETE, request);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(s3SendMock).toHaveBeenCalledTimes(1);
    expect(deleteObjectCommandCtorMock).toHaveBeenCalledTimes(1);
    const deleteArgs = deleteObjectCommandCtorMock.mock.calls[0][0];
    expect(deleteArgs.Bucket).toBe("bucket");
    expect(deleteArgs.Key).toBe("games-cover.png");
  });

  it("returns 500 when R2 credentials are missing", async () => {
    delete process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY;
    delete process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY;

    const { DELETE } = await import("@/app/api/upload-image/route");
    const request = makeDeleteRequest({
      imageKey: "custom_items-foo-abc.png",
    });
    const response = await invokeRoute(DELETE, request);
    expect(response.status).toBe(500);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("returns 204 and calls DeleteObject for custom_items- key", async () => {
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";

    const key = "custom_items-special_gun-xyz123.png";
    const { DELETE } = await import("@/app/api/upload-image/route");
    const request = makeDeleteRequest({ imageKey: key });
    const response = await invokeRoute(DELETE, request);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");

    expect(s3SendMock).toHaveBeenCalledTimes(1);
    expect(deleteObjectCommandCtorMock).toHaveBeenCalledTimes(1);
    const deleteArgs = deleteObjectCommandCtorMock.mock.calls[0][0];
    expect(deleteArgs.Bucket).toBe("bucket");
    expect(deleteArgs.Key).toBe(key);
  });

  it("returns 204 and calls DeleteObject for unique_items- key", async () => {
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";

    const key = "unique_items-variant-abc.webp";
    const { DELETE } = await import("@/app/api/upload-image/route");
    const request = makeDeleteRequest({ imageKey: key });
    const response = await invokeRoute(DELETE, request);
    expect(response.status).toBe(204);

    const deleteArgs = deleteObjectCommandCtorMock.mock.calls[0][0];
    expect(deleteArgs.Key).toBe(key);
  });
});
