import { getR2Config, isDeletableImageKey } from "@/app/lib/r2";
import { beforeEach, describe, expect, it, vi } from "vitest";

const s3ClientCtorMock = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation((...args: unknown[]) => {
    s3ClientCtorMock(...args);
    return {};
  }),
}));

describe("r2 helper", () => {
  const envBackup = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...envBackup };
  });

  describe("isDeletableImageKey", () => {
    it("returns true for keys starting with custom_items-", () => {
      expect(isDeletableImageKey("custom_items-special_gun-abc.png")).toBe(
        true
      );
      expect(isDeletableImageKey("custom_items-.png")).toBe(true);
    });

    it("returns true for keys starting with unique_items-", () => {
      expect(isDeletableImageKey("unique_items-variant-xyz.webp")).toBe(true);
      expect(isDeletableImageKey("unique_items-foo.jpeg")).toBe(true);
    });

    it("returns false for other key prefixes", () => {
      expect(isDeletableImageKey("characters-alexandra.png")).toBe(false);
      expect(isDeletableImageKey("games-cover.png")).toBe(false);
      expect(isDeletableImageKey("items-siike_gun.png")).toBe(false);
      expect(isDeletableImageKey("custom-items-old.png")).toBe(false);
      expect(isDeletableImageKey("unique-items-old.png")).toBe(false);
    });

    it("returns false for empty or unrelated keys", () => {
      expect(isDeletableImageKey("")).toBe(false);
      expect(isDeletableImageKey("random/key.png")).toBe(false);
    });
  });

  describe("getR2Config", () => {
    it("returns null when any required env var is missing", () => {
      delete process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY;
      expect(getR2Config()).toBeNull();

      process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
      delete process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY;
      expect(getR2Config()).toBeNull();

      process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
      delete process.env.R2_NEBLIR_ACCOUNT_ID;
      expect(getR2Config()).toBeNull();

      process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
      delete process.env.R2_NEBLIR_BUCKET_NAME;
      expect(getR2Config()).toBeNull();
    });

    it("returns config with bucketName and s3Client when all env vars are set", () => {
      process.env.R2_NEBLIR_ACCOUNT_ID = "acc-id";
      process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
      process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
      process.env.R2_NEBLIR_BUCKET_NAME = "my-bucket";

      const config = getR2Config();
      expect(config).not.toBeNull();
      expect(config!.bucketName).toBe("my-bucket");
      expect(config!.s3Client).toEqual({});

      expect(s3ClientCtorMock).toHaveBeenCalledTimes(1);
      const clientArgs = s3ClientCtorMock.mock.calls[0][0];
      expect(clientArgs.region).toBe("auto");
      expect(clientArgs.endpoint).toBe(
        "https://acc-id.r2.cloudflarestorage.com"
      );
      expect(clientArgs.credentials).toEqual({
        accessKeyId: "ak",
        secretAccessKey: "sk",
      });
    });
  });
});
