import { describe, expect, it } from "vitest";
import { resolveUniqueBotStats } from "@/app/lib/prisma/uniqueBot";

const weld = {
  name: "Weld",
  description: null,
  notes: null,
  numberOfDice: 1,
  attribute: null,
  damage: null,
};

const row = {
  id: "ub-1",
  gameId: "g-1",
  ownerUserId: "minter-1",
};

const template = {
  id: "bot-1",
  name: "Loader",
  maxHp: 12,
  actions: [weld],
  additionalActions: [weld],
};

describe("resolveUniqueBotStats bot actions", () => {
  it("inherits the template list when the override is unset", () => {
    const resolved = resolveUniqueBotStats(
      { ...row, actionsOverride: null, additionalActionsOverride: null },
      template
    );
    expect(resolved.actions).toEqual([weld]);
    expect(resolved.additionalActions).toEqual([weld]);
  });

  it("replaces the template list with an empty override", () => {
    const resolved = resolveUniqueBotStats(
      { ...row, actionsOverride: [], additionalActionsOverride: [] },
      template
    );
    expect(resolved.actions).toEqual([]);
    expect(resolved.additionalActions).toEqual([]);
  });
});
