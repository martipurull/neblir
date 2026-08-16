import { describe, expect, it } from "vitest";
import { weaponDamageTypeLabel } from "@/app/lib/weaponDamageTypeLabel";

describe("weaponDamageTypeLabel", () => {
  it("replaces underscores with spaces", () => {
    expect(weaponDamageTypeLabel("FOO_BAR")).toBe("FOO BAR");
    expect(weaponDamageTypeLabel("BLADE")).toBe("BLADE");
  });
});
