import {
  CATALOGUE_UPLOAD_TYPES,
  getCatalogueR2Config,
  getR2Config,
  getR2ConfigForKey,
  isCatalogueImageKey,
  isCatalogueUploadType,
  isDeletableUploadKey,
} from "@/app/lib/r2";
import { beforeEach, describe, expect, it, vi } from "vitest";

const s3ClientCtorMock = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(function (...args: unknown[]) {
    s3ClientCtorMock(...args);
    return {};
  }),
}));

function clearR2Env() {
  delete process.env.R2_NEBLIR_ACCOUNT_ID;
  delete process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY;
  delete process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY;
  delete process.env.R2_NEBLIR_BUCKET_NAME;
  delete process.env.R2_NEBLIR_CATALOGUE_BUCKET_NAME;
  delete process.env.R2_NEBLIR_CATALOGUE_BUCKET_ACCESS_KEY;
  delete process.env.R2_NEBLIR_CATALOGUE_BUCKET_SECRET_ACCESS_KEY;
}

describe("r2 helper", () => {
  const envBackup = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...envBackup };
    clearR2Env();
  });

  describe("isDeletableUploadKey", () => {
    it("returns true for keys starting with custom_items-", () => {
      expect(isDeletableUploadKey("custom_items-special_gun-abc.png")).toBe(
        true
      );
      expect(isDeletableUploadKey("custom_items-.png")).toBe(true);
    });

    it("returns true for keys starting with unique_items-", () => {
      expect(isDeletableUploadKey("unique_items-variant-xyz.webp")).toBe(true);
      expect(isDeletableUploadKey("unique_items-foo.jpeg")).toBe(true);
    });

    it("returns true for keys starting with items- (official catalogue)", () => {
      expect(isDeletableUploadKey("items-siike_gun.png")).toBe(true);
      expect(isDeletableUploadKey("items-official_sword-abc12.png")).toBe(true);
    });

    it("returns true for keys starting with maps- (official catalogue)", () => {
      expect(isDeletableUploadKey("maps-neblir.png")).toBe(true);
      expect(isDeletableUploadKey("maps-northern_federation.png")).toBe(true);
    });

    it("returns true for keys starting with enemies- (official catalogue)", () => {
      expect(isDeletableUploadKey("enemies-bandit-abc12.png")).toBe(true);
    });

    it("returns true for keys starting with custom_maps-", () => {
      expect(isDeletableUploadKey("custom_maps-table_map-abc12.png")).toBe(
        true
      );
    });

    it("returns false for currency art and unrelated prefixes", () => {
      expect(isDeletableUploadKey("custom-items-old.png")).toBe(false);
      expect(isDeletableUploadKey("unique-items-old.png")).toBe(false);
      expect(isDeletableUploadKey("currencies-conf.png")).toBe(false);
      expect(isDeletableUploadKey("currency-conf.png")).toBe(false);
    });

    it("returns true for keys starting with games- and characters-", () => {
      expect(isDeletableUploadKey("characters-alexandra.png")).toBe(true);
      expect(isDeletableUploadKey("games-cover.png")).toBe(true);
    });

    it("returns true for keys starting with files- and lore-", () => {
      expect(isDeletableUploadKey("files-citadel-abc.png")).toBe(true);
      expect(isDeletableUploadKey("files-handout-xyz.pdf")).toBe(true);
      expect(isDeletableUploadKey("lore-city_map-abc12.pdf")).toBe(true);
    });

    it("returns false for empty or unrelated keys", () => {
      expect(isDeletableUploadKey("")).toBe(false);
      expect(isDeletableUploadKey("random/key.png")).toBe(false);
    });
  });

  describe("isCatalogueImageKey", () => {
    it("returns true for official catalogue prefixes", () => {
      expect(isCatalogueImageKey("items-siike_gun.png")).toBe(true);
      expect(isCatalogueImageKey("items-weapons-hunting_harpoon.png")).toBe(
        true
      );
      expect(isCatalogueImageKey("vehicles-raceme-p7m64i6f.png")).toBe(true);
      expect(isCatalogueImageKey("maps-neblir.png")).toBe(true);
      expect(isCatalogueImageKey("enemies-plynth_s_hexops-9h5q0lwc.png")).toBe(
        true
      );
      expect(isCatalogueImageKey("currencies-conf.png")).toBe(true);
    });

    it("returns false for game-scoped, player-scoped, and leftover prefixes", () => {
      expect(isCatalogueImageKey("custom_items-special_gun-abc.png")).toBe(
        false
      );
      expect(isCatalogueImageKey("custom_vehicles-speeder-abc.png")).toBe(
        false
      );
      expect(isCatalogueImageKey("unique_items-variant-xyz.webp")).toBe(false);
      expect(isCatalogueImageKey("unique_vehicles-hotrod-abc.png")).toBe(false);
      expect(isCatalogueImageKey("custom_enemies-gm_thug-abc.png")).toBe(false);
      expect(isCatalogueImageKey("custom_maps-table_map-abc.png")).toBe(false);
      expect(isCatalogueImageKey("characters-alexandra.png")).toBe(false);
      expect(isCatalogueImageKey("games-cover.png")).toBe(false);
      expect(isCatalogueImageKey("files-handout-abc.png")).toBe(false);
      expect(isCatalogueImageKey("lore-note-abc.pdf")).toBe(false);
      expect(isCatalogueImageKey("recaps-session-abc.pdf")).toBe(false);
      expect(isCatalogueImageKey("currency-conf.png")).toBe(false);
    });
  });

  describe("isCatalogueUploadType", () => {
    it("is true for official catalogue upload types and false otherwise", () => {
      for (const type of CATALOGUE_UPLOAD_TYPES) {
        expect(isCatalogueUploadType(type)).toBe(true);
      }
      expect(isCatalogueUploadType("custom_items")).toBe(false);
      expect(isCatalogueUploadType("custom_maps")).toBe(false);
      expect(isCatalogueUploadType("currencies")).toBe(false);
    });
  });

  describe("getR2Config", () => {
    it("returns null when any required env var is missing", () => {
      process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
      expect(getR2Config()).toBeNull();

      process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
      expect(getR2Config()).toBeNull();

      process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
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

  describe("getCatalogueR2Config", () => {
    it("returns null when any required catalogue env var is missing", () => {
      process.env.R2_NEBLIR_ACCOUNT_ID = "acc-id";
      process.env.R2_NEBLIR_CATALOGUE_BUCKET_ACCESS_KEY = "cat-ak";
      process.env.R2_NEBLIR_CATALOGUE_BUCKET_SECRET_ACCESS_KEY = "cat-sk";
      expect(getCatalogueR2Config()).toBeNull();

      process.env.R2_NEBLIR_CATALOGUE_BUCKET_NAME = "neblir-catalogue";
      delete process.env.R2_NEBLIR_CATALOGUE_BUCKET_ACCESS_KEY;
      expect(getCatalogueR2Config()).toBeNull();
    });

    it("returns config for the catalogue bucket and reuses the account id", () => {
      process.env.R2_NEBLIR_ACCOUNT_ID = "acc-id";
      process.env.R2_NEBLIR_CATALOGUE_BUCKET_NAME = "neblir-catalogue";
      process.env.R2_NEBLIR_CATALOGUE_BUCKET_ACCESS_KEY = "cat-ak";
      process.env.R2_NEBLIR_CATALOGUE_BUCKET_SECRET_ACCESS_KEY = "cat-sk";

      const config = getCatalogueR2Config();
      expect(config).not.toBeNull();
      expect(config!.bucketName).toBe("neblir-catalogue");

      expect(s3ClientCtorMock).toHaveBeenCalledTimes(1);
      const clientArgs = s3ClientCtorMock.mock.calls[0][0];
      expect(clientArgs.endpoint).toBe(
        "https://acc-id.r2.cloudflarestorage.com"
      );
      expect(clientArgs.credentials).toEqual({
        accessKeyId: "cat-ak",
        secretAccessKey: "cat-sk",
      });
    });
  });

  describe("getR2ConfigForKey", () => {
    it("uses the catalogue client for catalogue keys and the env client otherwise", () => {
      process.env.R2_NEBLIR_ACCOUNT_ID = "acc-id";
      process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
      process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
      process.env.R2_NEBLIR_BUCKET_NAME = "my-bucket";
      process.env.R2_NEBLIR_CATALOGUE_BUCKET_NAME = "neblir-catalogue";
      process.env.R2_NEBLIR_CATALOGUE_BUCKET_ACCESS_KEY = "cat-ak";
      process.env.R2_NEBLIR_CATALOGUE_BUCKET_SECRET_ACCESS_KEY = "cat-sk";

      expect(getR2ConfigForKey("items-siike_gun.png")?.bucketName).toBe(
        "neblir-catalogue"
      );
      expect(
        getR2ConfigForKey("custom_enemies-gm_thug-abc.png")?.bucketName
      ).toBe("my-bucket");
    });

    it("returns null for a catalogue key when catalogue env is missing even if env bucket is set", () => {
      process.env.R2_NEBLIR_ACCOUNT_ID = "acc-id";
      process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
      process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
      process.env.R2_NEBLIR_BUCKET_NAME = "my-bucket";

      expect(getR2ConfigForKey("maps-neblir.png")).toBeNull();
      expect(getR2ConfigForKey("characters-alexandra.png")?.bucketName).toBe(
        "my-bucket"
      );
    });
  });
});
