import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearUniqueItemDraft,
  isMeaningfulUniqueItemDraft,
  persistUniqueItemDraft,
  readUniqueItemDraft,
  uniqueItemDraftStorageKey,
  type UniqueItemDraft,
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

const characterScope = { kind: "character" as const, id: "char-1" };

function emptyDraft(overrides: Partial<UniqueItemDraft> = {}): UniqueItemDraft {
  return {
    sourceType: "GLOBAL_ITEM",
    selectedTemplateId: null,
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
    ...overrides,
  };
}

describe("uniqueItemDraftStorage (character scope)", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("uses a per-character storage key", () => {
    expect(uniqueItemDraftStorageKey(characterScope)).toBe(
      "neblir:character-unique-item-draft:v1:char-1"
    );
  });

  it("round-trips a meaningful draft", () => {
    const draft = emptyDraft({
      sourceType: "STANDALONE",
      nameOverride: "Lucky charm",
      weightOverride: "0.2",
      notesOverride: "<p>Found in a cave</p>",
    });
    persistUniqueItemDraft(characterScope, draft);
    expect(readUniqueItemDraft(characterScope)).toEqual(draft);
  });

  it("does not persist empty drafts", () => {
    persistUniqueItemDraft(characterScope, emptyDraft());
    expect(storage.has(uniqueItemDraftStorageKey(characterScope))).toBe(false);
    expect(readUniqueItemDraft(characterScope)).toBeNull();
  });

  it("clears stored draft on demand", () => {
    persistUniqueItemDraft(
      characterScope,
      emptyDraft({ nameOverride: "Saved" })
    );
    clearUniqueItemDraft(characterScope);
    expect(readUniqueItemDraft(characterScope)).toBeNull();
  });

  it("treats template selection as meaningful", () => {
    expect(
      isMeaningfulUniqueItemDraft(emptyDraft({ selectedTemplateId: "item-42" }))
    ).toBe(true);
  });
});
