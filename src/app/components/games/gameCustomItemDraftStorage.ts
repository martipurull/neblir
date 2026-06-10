import {
  buildModalDraftStorageKey,
  clearModalSessionDraft,
  draftHasNonEmptyScalars,
  draftStrField,
  draftStringArrayField,
  persistModalSessionDraft,
  readModalSessionDraft,
} from "@/app/components/games/modalSessionDraftStorage";

export type GameCustomItemDraft = {
  name: string;
  weight: string;
  type: "GENERAL_ITEM" | "WEAPON";
  description: string;
  notes: string;
  usage: string;
  costInfo: string;
  confCost: string;
  equippable: boolean;
  equipSlotTypes: string[];
  equipSlotCost: string;
  maxUses: string;
  modifiesAttribute: string;
  attributeMod: string;
  modifiesSkill: string;
  skillMod: string;
  isSpeedAltered: boolean;
  attackRoll: string[];
  attackMeleeBonus: string;
  attackRangeBonus: string;
  attackThrowBonus: string;
  defenceMeleeBonus: string;
  defenceRangeBonus: string;
  gridAttackBonus: string;
  gridDefenceBonus: string;
  effectiveRange: string;
  maxRange: string;
  damageTypes: string[];
  damageDiceType: string;
  damageNumberOfDice: string;
  imageKey: string;
};

const GAME_CUSTOM_ITEM_DRAFT_VERSION = 1;

export function gameCustomItemDraftStorageKey(gameId: string): string {
  return buildModalDraftStorageKey(
    "game-custom-item-draft",
    GAME_CUSTOM_ITEM_DRAFT_VERSION,
    gameId
  );
}

function parseItemType(v: unknown): "GENERAL_ITEM" | "WEAPON" | null {
  if (v === "GENERAL_ITEM" || v === "WEAPON") return v;
  return null;
}

function normaliseGameCustomItemDraft(
  parsed: Record<string, unknown>
): GameCustomItemDraft | null {
  const type = parseItemType(parsed.type);
  if (!type) return null;

  return {
    name: draftStrField(parsed.name),
    weight: draftStrField(parsed.weight),
    type,
    description: draftStrField(parsed.description),
    notes: draftStrField(parsed.notes),
    usage: draftStrField(parsed.usage),
    costInfo: draftStrField(parsed.costInfo),
    confCost: draftStrField(parsed.confCost),
    equippable: parsed.equippable === true,
    equipSlotTypes: draftStringArrayField(parsed.equipSlotTypes),
    equipSlotCost: draftStrField(parsed.equipSlotCost),
    maxUses: draftStrField(parsed.maxUses),
    modifiesAttribute: draftStrField(parsed.modifiesAttribute),
    attributeMod: draftStrField(parsed.attributeMod),
    modifiesSkill: draftStrField(parsed.modifiesSkill),
    skillMod: draftStrField(parsed.skillMod),
    isSpeedAltered: parsed.isSpeedAltered === true,
    attackRoll: draftStringArrayField(parsed.attackRoll),
    attackMeleeBonus: draftStrField(parsed.attackMeleeBonus),
    attackRangeBonus: draftStrField(parsed.attackRangeBonus),
    attackThrowBonus: draftStrField(parsed.attackThrowBonus),
    defenceMeleeBonus: draftStrField(parsed.defenceMeleeBonus),
    defenceRangeBonus: draftStrField(parsed.defenceRangeBonus),
    gridAttackBonus: draftStrField(parsed.gridAttackBonus),
    gridDefenceBonus: draftStrField(parsed.gridDefenceBonus),
    effectiveRange: draftStrField(parsed.effectiveRange),
    maxRange: draftStrField(parsed.maxRange),
    damageTypes: draftStringArrayField(parsed.damageTypes),
    damageDiceType: draftStrField(parsed.damageDiceType),
    damageNumberOfDice: draftStrField(parsed.damageNumberOfDice),
    imageKey: draftStrField(parsed.imageKey),
  };
}

export function isMeaningfulGameCustomItemDraft(
  draft: GameCustomItemDraft
): boolean {
  if (draft.imageKey.trim()) return true;
  if (draft.equippable) return true;
  if (draft.isSpeedAltered) return true;
  if (draft.type === "WEAPON") return true;
  if (
    draftHasNonEmptyScalars([
      draft.name,
      draft.weight,
      draft.description,
      draft.notes,
      draft.usage,
      draft.costInfo,
      draft.confCost,
      draft.equipSlotCost,
      draft.maxUses,
      draft.modifiesAttribute,
      draft.attributeMod,
      draft.modifiesSkill,
      draft.skillMod,
      draft.attackMeleeBonus,
      draft.attackRangeBonus,
      draft.attackThrowBonus,
      draft.defenceMeleeBonus,
      draft.defenceRangeBonus,
      draft.gridAttackBonus,
      draft.gridDefenceBonus,
      draft.effectiveRange,
      draft.maxRange,
      draft.damageDiceType,
      draft.damageNumberOfDice,
    ])
  ) {
    return true;
  }
  if (draft.equipSlotTypes.length > 0) return true;
  if (draft.attackRoll.length > 0) return true;
  if (draft.damageTypes.length > 0) return true;
  return false;
}

export function readGameCustomItemDraft(
  gameId: string
): GameCustomItemDraft | null {
  return readModalSessionDraft({
    storageKey: gameCustomItemDraftStorageKey(gameId),
    version: GAME_CUSTOM_ITEM_DRAFT_VERSION,
    normalize: normaliseGameCustomItemDraft,
    isMeaningful: isMeaningfulGameCustomItemDraft,
  });
}

export function persistGameCustomItemDraft(
  gameId: string,
  draft: GameCustomItemDraft
): void {
  persistModalSessionDraft({
    storageKey: gameCustomItemDraftStorageKey(gameId),
    version: GAME_CUSTOM_ITEM_DRAFT_VERSION,
    draft,
    isMeaningful: isMeaningfulGameCustomItemDraft,
  });
}

export function clearGameCustomItemDraft(gameId: string): void {
  clearModalSessionDraft(gameCustomItemDraftStorageKey(gameId));
}
