import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearGameCustomItemDraft,
  gameCustomItemDraftStorageKey,
  persistGameCustomItemDraft,
  readGameCustomItemDraft,
} from "@/app/components/games/gameCustomItemDraftStorage";
import {
  clearGameCustomEnemyDraft,
  gameCustomEnemyDraftStorageKey,
  persistGameCustomEnemyDraft,
  readGameCustomEnemyDraft,
} from "@/app/components/games/gameCustomEnemyDraftStorage";
import {
  persistUniqueItemDraft,
  readUniqueItemDraft,
  uniqueItemDraftStorageKey,
} from "@/app/components/games/uniqueItemDraftStorage";

const storage = vi.hoisted(() => new Map<string, string>());

vi.stubGlobal("sessionStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  clear: () => {
    storage.clear();
  },
});

describe("game modal draft storage", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("uses per-game keys for GM create flows", () => {
    expect(gameCustomItemDraftStorageKey("game-1")).toBe(
      "neblir:game-custom-item-draft:v1:game-1"
    );
    expect(gameCustomEnemyDraftStorageKey("game-1")).toBe(
      "neblir:game-custom-enemy-draft:v1:game-1"
    );
    expect(uniqueItemDraftStorageKey({ kind: "game", id: "game-1" })).toBe(
      "neblir:game-unique-item-draft:v1:game-1"
    );
  });

  it("round-trips a custom item draft", () => {
    const draft = {
      name: "Healing salve",
      weight: "0.1",
      type: "GENERAL_ITEM" as const,
      description: "",
      notes: "",
      usage: "",
      costInfo: "",
      confCost: "",
      equippable: false,
      equipSlotTypes: [],
      equipSlotCost: "",
      maxUses: "",
      modifiesAttribute: "",
      attributeMod: "",
      modifiesSkill: "",
      skillMod: "",
      isSpeedAltered: false,
      attackRoll: [],
      attackMeleeBonus: "",
      attackRangeBonus: "",
      attackThrowBonus: "",
      defenceMeleeBonus: "",
      defenceRangeBonus: "",
      gridAttackBonus: "",
      gridDefenceBonus: "",
      effectiveRange: "",
      maxRange: "",
      damageTypes: [],
      damageDiceType: "",
      damageNumberOfDice: "",
      imageKey: "",
    };
    persistGameCustomItemDraft("game-1", draft);
    expect(readGameCustomItemDraft("game-1")).toEqual(draft);
    clearGameCustomItemDraft("game-1");
    expect(readGameCustomItemDraft("game-1")).toBeNull();
  });

  it("round-trips a custom enemy draft", () => {
    const draft = {
      name: "Bandit",
      description: "",
      notes: "",
      health: "12",
      speed: "4",
      initiativeModifier: "1",
      numberOfReactions: "1",
      defenceMelee: "",
      defenceRange: "",
      defenceGrid: "",
      attackMelee: "",
      attackRange: "",
      attackThrow: "",
      attackGrid: "",
      actions: [],
      additionalActions: [],
      immunities: [],
      resistances: [],
      vulnerabilities: [],
      imageKey: "",
    };
    persistGameCustomEnemyDraft("game-1", draft);
    expect(readGameCustomEnemyDraft("game-1")).toEqual(draft);
    clearGameCustomEnemyDraft("game-1");
    expect(readGameCustomEnemyDraft("game-1")).toBeNull();
  });

  it("round-trips a game-scoped unique item draft", () => {
    persistUniqueItemDraft(
      { kind: "game", id: "game-1" },
      {
        sourceType: "GLOBAL_ITEM",
        selectedTemplateId: "item-1",
        nameOverride: "",
        descriptionOverride: "",
        notesOverride: "",
        usageOverride: "",
        costInfoOverride: "",
        confCostOverride: "",
        weightOverride: "",
        specialTag: "",
        equippableOverride: "",
        equipSlotTypesOverride: [],
        equipSlotCostOverride: "",
        maxUsesOverride: "",
        modifiesAttributeOverride: "",
        attributeModOverride: "",
        modifiesSkillOverride: "",
        skillModOverride: "",
        isSpeedAlteredOverride: "",
        isSpeedAlteredStandalone: false,
        attackRollOverride: [],
        attackMeleeBonusOverride: "",
        attackRangeBonusOverride: "",
        attackThrowBonusOverride: "",
        defenceMeleeBonusOverride: "",
        defenceRangeBonusOverride: "",
        gridAttackBonusOverride: "",
        gridDefenceBonusOverride: "",
        effectiveRangeOverride: "",
        maxRangeOverride: "",
        damageTypesOverride: [],
        damageDiceTypeOverride: "",
        damageNumberOfDiceOverride: "",
        imageKeyOverride: "",
      }
    );
    expect(
      readUniqueItemDraft({ kind: "game", id: "game-1" })?.selectedTemplateId
    ).toBe("item-1");
  });
});
