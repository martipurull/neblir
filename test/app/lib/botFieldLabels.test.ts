import { describe, expect, it } from "vitest";
import { botOpenEndedStatLabel } from "@/app/lib/botFieldLabels";

describe("bot open-ended stat labels", () => {
  it("puts the bound on the label for a bot that owns the value", () => {
    expect(botOpenEndedStatLabel("maxHp")).toBe("Max HP (1 or more)");
    expect(botOpenEndedStatLabel("speed")).toBe("Speed (m, 0 or more)");
    expect(botOpenEndedStatLabel("maxCarry")).toBe("Max carry (kg, 0 or more)");
    expect(botOpenEndedStatLabel("height")).toBe(
      "Height (m, optional, 0 or more)"
    );
    expect(botOpenEndedStatLabel("weight")).toBe(
      "Weight (kg, optional, 0 or more)"
    );
    expect(botOpenEndedStatLabel("cargo")).toBe(
      "Cargo max (kg, empty = no cap)"
    );
    expect(botOpenEndedStatLabel("installed")).toBe(
      "Installed max (empty = no cap)"
    );
  });

  it("keeps a template override blank as the template, including cargo and installed", () => {
    expect(botOpenEndedStatLabel("maxHp", { override: true })).toBe(
      "Max HP override (1 or more)"
    );
    expect(botOpenEndedStatLabel("cargo", { override: true })).toBe(
      "Cargo max override (kg)"
    );
    expect(botOpenEndedStatLabel("installed", { override: true })).toBe(
      "Installed max override"
    );
  });
});
