import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeUnauthedRequest } from "../helpers";

const getSignedUrlMock = vi.fn();
const s3ClientCtorMock = vi.fn();
const getObjectCommandCtorMock = vi.fn();

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: getSignedUrlMock,
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation((...args: unknown[]) => {
    s3ClientCtorMock(...args);
    return {};
  }),
  GetObjectCommand: vi.fn().mockImplementation((...args: unknown[]) => {
    getObjectCommandCtorMock(...args);
    return {};
  }),
}));

describe("/api/image-url GET", () => {
  const envBackup = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...envBackup };
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/image-url/route");
    const request = {
      ...makeUnauthedRequest(),
      nextUrl: { searchParams: new URLSearchParams("imageKey=characters/a.png") },
    } as any;
    const response = await invokeRoute(GET, request);
    expect(response.status).toBe(401);
  });

  it("returns 400 when image key is missing", async () => {
    const { GET } = await import("@/app/api/image-url/route");
    const request = {
      ...makeAuthedRequest(undefined, "user-1"),
      nextUrl: { searchParams: new URLSearchParams("") },
    } as any;
    const response = await invokeRoute(GET, request);
    expect(response.status).toBe(400);
  });

  it("returns 500 when credentials are missing", async () => {
    delete process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY;
    delete process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY;
    const { GET } = await import("@/app/api/image-url/route");
    const request = {
      ...makeAuthedRequest(undefined, "user-1"),
      nextUrl: { searchParams: new URLSearchParams("imageKey=characters/a.png") },
    } as any;
    const response = await invokeRoute(GET, request);
    expect(response.status).toBe(500);
  });

  it("returns 200 with signed url", async () => {
    process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
    process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
    process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
    process.env.R2_NEBLIR_BUCKET_NAME = "bucket";
    getSignedUrlMock.mockResolvedValue("https://signed/url");

    const { GET } = await import("@/app/api/image-url/route");
    const request = {
      ...makeAuthedRequest(undefined, "user-1"),
      nextUrl: { searchParams: new URLSearchParams("imageKey=characters/a.png") },
    } as any;
    const response = await invokeRoute(GET, request);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ url: "https://signed/url" });
  });
});
