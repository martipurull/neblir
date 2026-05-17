import { describe, expect, it } from "vitest";
import {
  bumpNumericFieldValue,
  coerceNumericFieldValue,
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
