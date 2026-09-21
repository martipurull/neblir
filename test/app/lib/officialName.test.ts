import { describe, expect, it } from "vitest";
import {
  normalizeOfficialName,
  officialNameConflicts,
} from "@/app/lib/officialName";

describe("normalizeOfficialName", () => {
  it("trims, case-folds, and collapses internal whitespace", () => {
    expect(normalizeOfficialName("  Siike   Gun  ")).toBe("siike gun");
  });

  it("case-folds sharp s so STRAßE is the same Official name as STRASSE", () => {
    expect(normalizeOfficialName("STRAßE")).toBe("strasse");
    expect(normalizeOfficialName("STRAẞE")).toBe("strasse");
  });
});

describe("officialNameConflicts", () => {
  const existing = [{ id: "item-1", name: "Siike Gun" }];

  it("treats names that differ only by case or extra spaces as the same Official name", () => {
    expect(officialNameConflicts(existing, "siike gun")).toBe(true);
    expect(officialNameConflicts(existing, "siike  gun")).toBe(true);
  });

  it("does not treat SiikeGun as the same Official name as Siike Gun", () => {
    expect(officialNameConflicts(existing, "SiikeGun")).toBe(false);
  });

  it("does not report a conflict when the only match is the excluded id", () => {
    expect(officialNameConflicts(existing, "Siike Gun", "item-1")).toBe(false);
    expect(officialNameConflicts(existing, "siike gun", "item-1")).toBe(false);
    expect(officialNameConflicts(existing, "Siike Gun", " item-1 ")).toBe(
      false
    );
  });

  it("treats STRAßE and STRASSE as the same Official name", () => {
    expect(
      officialNameConflicts([{ id: "item-1", name: "STRASSE" }], "STRAßE")
    ).toBe(true);
  });

  it("reports a conflict even when the existing row would differ only by accessType identity", () => {
    expect(
      officialNameConflicts([{ id: "gm-only", name: "Siike Gun" }], "Siike Gun")
    ).toBe(true);
  });
});
