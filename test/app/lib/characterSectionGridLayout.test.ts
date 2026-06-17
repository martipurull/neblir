import { describe, expect, it } from "vitest";
import {
  CHARACTER_SECTION_GRID_PREVIEW_OPTIONS,
  CHARACTER_SECTION_ORDER_PREVIEW_CHIP_WIDTH_CLASS,
  characterSectionGridPreviewColumnCount,
  characterSectionGridPreviewGridClassName,
  getAvailableCharacterSectionGridPreviewOptions,
  isCharacterSectionGridPreview,
  resolveCharacterSectionGridPreviewForViewport,
} from "@/app/lib/characterSectionGridLayout";

describe("characterSectionGridLayout", () => {
  it("defines four preview breakpoints", () => {
    expect(CHARACTER_SECTION_GRID_PREVIEW_OPTIONS).toEqual([
      { value: "mobile", label: "Mobile" },
      { value: "tablet", label: "Tablet" },
      { value: "desktopSmall", label: "Desktop S" },
      { value: "desktopLarge", label: "Desktop L" },
    ]);
  });

  it("validates preview breakpoint ids", () => {
    expect(isCharacterSectionGridPreview("mobile")).toBe(true);
    expect(isCharacterSectionGridPreview("desktopLarge")).toBe(true);
    expect(isCharacterSectionGridPreview("wide")).toBe(false);
  });

  it("maps preview breakpoints to fixed-width column grids", () => {
    expect(characterSectionGridPreviewColumnCount("mobile")).toBe(1);
    expect(characterSectionGridPreviewColumnCount("desktopLarge")).toBe(4);
    expect(characterSectionGridPreviewGridClassName("mobile")).toBe(
      "grid gap-2 [grid-template-columns:repeat(1,8.5rem)]"
    );
    expect(characterSectionGridPreviewGridClassName("tablet")).toBe(
      "grid gap-2 [grid-template-columns:repeat(2,8.5rem)]"
    );
    expect(characterSectionGridPreviewGridClassName("desktopSmall")).toBe(
      "grid gap-2 [grid-template-columns:repeat(3,8.5rem)]"
    );
    expect(characterSectionGridPreviewGridClassName("desktopLarge")).toBe(
      "grid gap-2 [grid-template-columns:repeat(4,8.5rem)]"
    );
    expect(CHARACTER_SECTION_ORDER_PREVIEW_CHIP_WIDTH_CLASS).toBe("w-[8.5rem]");
  });

  it("limits preview options to what fits the current viewport", () => {
    expect(
      getAvailableCharacterSectionGridPreviewOptions(390).map((o) => o.value)
    ).toEqual(["mobile"]);
    expect(
      getAvailableCharacterSectionGridPreviewOptions(900).map((o) => o.value)
    ).toEqual(["mobile", "tablet"]);
    expect(
      getAvailableCharacterSectionGridPreviewOptions(1400).map((o) => o.value)
    ).toEqual(["mobile", "tablet", "desktopSmall"]);
    expect(
      getAvailableCharacterSectionGridPreviewOptions(1600).map((o) => o.value)
    ).toEqual(["mobile", "tablet", "desktopSmall", "desktopLarge"]);
  });

  it("clamps an unavailable preview to the largest supported option", () => {
    expect(
      resolveCharacterSectionGridPreviewForViewport("desktopLarge", 390)
    ).toBe("mobile");
    expect(
      resolveCharacterSectionGridPreviewForViewport("desktopLarge", 1600)
    ).toBe("desktopLarge");
    expect(resolveCharacterSectionGridPreviewForViewport("tablet", 900)).toBe(
      "tablet"
    );
  });
});
