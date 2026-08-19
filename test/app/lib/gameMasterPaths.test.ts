import { describe, expect, it } from "vitest";
import {
  gameMasterPath,
  gameMasterTableSettingsPath,
} from "@/app/lib/gameMasterPaths";

describe("gameMasterPaths", () => {
  it("builds the live GM table and table-settings routes", () => {
    expect(gameMasterPath("game-1")).toBe("/home/games/game-1/gm");
    expect(gameMasterTableSettingsPath("game-1")).toBe(
      "/home/games/game-1/gm/table-settings"
    );
  });
});
