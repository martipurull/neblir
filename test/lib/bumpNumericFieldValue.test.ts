import { describe, expect, it } from "vitest";
import {
  bumpNumericFieldValue,
  coerceNumericFieldValue,
  isReplaceableZeroDisplay,
  normalizeNumericInputOnType,
} from "@/app/components/shared/bumpNumericFieldValue";

describe("bumpNumericFieldValue", () => {
  it("increments and respects max", () => {
    expect(bumpNumericFieldValue("3", 1, 1, 6, 1)).toBe("4");
    expect(bumpNumericFieldValue("6", 1, 1, 6, 1)).toBe("6");
  });

  it("decrements and respects min", () => {
    expect(bumpNumericFieldValue("2", -1, 1, 6, 1)).toBe("1");
    expect(bumpNumericFieldValue("1", -1, 1, 6, 1)).toBe("1");
  });

  it("treats empty as zero before applying min", () => {
    expect(bumpNumericFieldValue("", 1, 1, undefined, 1)).toBe("1");
  });
});

describe("isReplaceableZeroDisplay", () => {
  it("treats integer zero as replaceable", () => {
    expect(isReplaceableZeroDisplay("0")).toBe(true);
    expect(isReplaceableZeroDisplay("00")).toBe(true);
  });

  it("does not treat empty, decimal, or non-zero as replaceable", () => {
    expect(isReplaceableZeroDisplay("")).toBe(false);
    expect(isReplaceableZeroDisplay("0.")).toBe(false);
    expect(isReplaceableZeroDisplay("5")).toBe(false);
    expect(isReplaceableZeroDisplay("-")).toBe(false);
  });
});

describe("normalizeNumericInputOnType", () => {
  it("replaces lone zero when typing a digit", () => {
    expect(normalizeNumericInputOnType("0", "05")).toBe("5");
    expect(normalizeNumericInputOnType("0", "012")).toBe("12");
  });

  it("preserves multi-digit numbers and decimal entry", () => {
    expect(normalizeNumericInputOnType("0", "10")).toBe("10");
    expect(normalizeNumericInputOnType("0", "0.")).toBe("0.");
    expect(normalizeNumericInputOnType("5", "56")).toBe("56");
  });

  it("does not rewrite when previous value was not replaceable zero", () => {
    expect(normalizeNumericInputOnType("12", "125")).toBe("125");
    expect(normalizeNumericInputOnType("0.", "0.5")).toBe("0.5");
  });
});

describe("coerceNumericFieldValue", () => {
  it("returns a number, never a string", () => {
    expect(typeof coerceNumericFieldValue("4", "int", 1, 6)).toBe("number");
    expect(coerceNumericFieldValue("4", "int", 1, 6)).toBe(4);
  });

  it("uses min as fallback for empty or invalid input", () => {
    expect(coerceNumericFieldValue("", "int", 1, 6)).toBe(1);
    expect(coerceNumericFieldValue("abc", "int", 1, 6)).toBe(1);
  });

  it("clamps to max", () => {
    expect(coerceNumericFieldValue("99", "int", 1, 6)).toBe(6);
  });
});
