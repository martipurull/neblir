import { describe, expect, it } from "vitest";
import {
  resolveCarouselIndex,
  resolveCarouselNavAvailability,
  resolveCharacterCarouselWrap,
} from "@/hooks/use-carousel";

describe("resolveCharacterCarouselWrap", () => {
  it("defaults to true when preference is null", () => {
    expect(resolveCharacterCarouselWrap(null)).toBe(true);
  });

  it("defaults to true when preference is undefined", () => {
    expect(resolveCharacterCarouselWrap(undefined)).toBe(true);
  });

  it("preserves explicit false", () => {
    expect(resolveCharacterCarouselWrap(false)).toBe(false);
  });

  it("preserves explicit true", () => {
    expect(resolveCharacterCarouselWrap(true)).toBe(true);
  });
});

describe("resolveCarouselIndex", () => {
  const count = 5;

  it("wraps indices when wrapAtEdges is true", () => {
    expect(resolveCarouselIndex(-1, count, true)).toBe(4);
    expect(resolveCarouselIndex(5, count, true)).toBe(0);
  });

  it("clamps indices when wrapAtEdges is false", () => {
    expect(resolveCarouselIndex(-1, count, false)).toBe(0);
    expect(resolveCarouselIndex(5, count, false)).toBe(4);
    expect(resolveCarouselIndex(2, count, false)).toBe(2);
  });

  it("returns 0 for empty section count", () => {
    expect(resolveCarouselIndex(3, 0, true)).toBe(0);
    expect(resolveCarouselIndex(3, 0, false)).toBe(0);
  });
});

describe("resolveCarouselNavAvailability", () => {
  it("keeps both arrows enabled when wrapping and sections exist", () => {
    expect(resolveCarouselNavAvailability(true, 5, 0)).toEqual({
      canGoPrev: true,
      canGoNext: true,
    });
    expect(resolveCarouselNavAvailability(true, 5, 4)).toEqual({
      canGoPrev: true,
      canGoNext: true,
    });
  });

  it("disables both arrows when wrapping and there are no sections", () => {
    expect(resolveCarouselNavAvailability(true, 0, 0)).toEqual({
      canGoPrev: false,
      canGoNext: false,
    });
  });

  it("clamps arrow availability at edges when wrap is disabled", () => {
    expect(resolveCarouselNavAvailability(false, 5, 0)).toEqual({
      canGoPrev: false,
      canGoNext: true,
    });
    expect(resolveCarouselNavAvailability(false, 5, 4)).toEqual({
      canGoPrev: true,
      canGoNext: false,
    });
    expect(resolveCarouselNavAvailability(false, 5, 2)).toEqual({
      canGoPrev: true,
      canGoNext: true,
    });
  });
});
