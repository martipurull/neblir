import { describe, expect, it } from "vitest";
import { foldSharedName } from "@/app/lib/sharedNameFold";

describe("foldSharedName", () => {
  it("treats a possessive 's, case, and spacing as the same name", () => {
    expect(foldSharedName("Indira's Crew")).toBe("indira crew");
    expect(foldSharedName("Indira Crew")).toBe("indira crew");
    expect(foldSharedName("  indira   crew ")).toBe("indira crew");
    expect(foldSharedName("Indira’s Crew")).toBe("indira crew");
  });

  it("keeps a trailing s that is not a possessive", () => {
    expect(foldSharedName("Guns")).toBe("guns");
    expect(foldSharedName("Gun")).toBe("gun");
  });

  it("drops remaining punctuation and collapses the spaces that leaves", () => {
    expect(foldSharedName("Archived!")).toBe("archived");
    expect(foldSharedName("archived's")).toBe("archived");
    expect(foldSharedName("Ungrouped!")).toBe("ungrouped");
    expect(foldSharedName("Indira - Crew")).toBe("indira crew");
    expect(foldSharedName("Indira-Crew")).toBe("indiracrew");
  });

  it("case-folds sharp s before it drops a possessive", () => {
    expect(foldSharedName("STRAßE")).toBe("strasse");
    expect(foldSharedName("STRAßE's")).toBe("strasse");
    expect(foldSharedName("STRAẞE")).toBe(foldSharedName("STRASSE"));
  });
});
