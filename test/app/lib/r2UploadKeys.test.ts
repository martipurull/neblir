import { describe, expect, it } from "vitest";
import {
  buildUploadKey,
  imageContentTypeFromFileName,
  isValidGameFileKey,
  isValidLoreAttachmentFileKey,
  isValidRecapFileKey,
} from "@/app/lib/r2UploadKeys";

describe("r2UploadKeys", () => {
  it("builds files- keys with image or pdf extensions", () => {
    expect(buildUploadKey("files", "Industrial compound map.png")).toMatch(
      /^files-industrial_compound_map-[a-z0-9]+\.png$/
    );
    expect(buildUploadKey("files", "Handout.pdf")).toMatch(
      /^files-handout-[a-z0-9]+\.pdf$/
    );
  });

  it("builds lore- keys with image or pdf extensions", () => {
    expect(buildUploadKey("lore", "City Map.pdf")).toMatch(
      /^lore-city_map-[a-z0-9]+\.pdf$/
    );
    expect(buildUploadKey("lore", "Faction crest.png")).toMatch(
      /^lore-faction_crest-[a-z0-9]+\.png$/
    );
  });

  it("validates game file keys by kind", () => {
    expect(isValidGameFileKey("files-citadel.png", "IMAGE")).toBe(true);
    expect(isValidGameFileKey("files-handout.pdf", "PDF")).toBe(true);
    expect(isValidGameFileKey("files-handout.pdf", "IMAGE")).toBe(false);
    expect(isValidGameFileKey("games-cover.png", "IMAGE")).toBe(false);
  });

  it("validates lore and recap keys", () => {
    expect(isValidLoreAttachmentFileKey("lore-map.pdf")).toBe(true);
    expect(isValidLoreAttachmentFileKey("lore-crest.png")).toBe(true);
    expect(isValidLoreAttachmentFileKey("lore-crest.png", "IMAGE")).toBe(true);
    expect(isValidLoreAttachmentFileKey("lore-crest.png", "PDF")).toBe(false);
    expect(isValidLoreAttachmentFileKey("files-map.pdf")).toBe(false);
    expect(isValidRecapFileKey("recaps-s1.pdf")).toBe(true);
  });

  it("maps image content types from filenames", () => {
    expect(imageContentTypeFromFileName("photo.jpg")).toBe("image/jpeg");
    expect(imageContentTypeFromFileName("photo.webp")).toBe("image/webp");
    expect(imageContentTypeFromFileName("photo.png")).toBe("image/png");
  });
});
