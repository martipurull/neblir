import {
  buildModalDraftStorageKey,
  clearModalSessionDraft,
  draftBoolOrEmptyField,
  draftHasNonEmptyScalars,
  draftStrField,
  draftStringArrayField,
  persistModalSessionDraft,
  readModalSessionDraft,
} from "@/app/components/games/modalSessionDraftStorage";

type UniqueItemDraftSourceType = "GLOBAL_ITEM" | "CUSTOM_ITEM" | "STANDALONE";

export type UniqueItemDraft = {
  sourceType: UniqueItemDraftSourceType;
  selectedTemplateId: string | null;
  nameOverride: string;
  descriptionOverride: string;
  notesOverride: string;
  usageOverride: string;
  costInfoOverride: string;
  confCostOverride: string;
  weightOverride: string;
  specialTag: string;
  equippableOverride: boolean | "";
  equipSlotTypesOverride: string[];
  equipSlotCostOverride: string;
  maxUsesOverride: string;
  modifiesAttributeOverride: string;
  attributeModOverride: string;
  modifiesSkillOverride: string;
  skillModOverride: string;
  isSpeedAlteredOverride: boolean | "";
  isSpeedAlteredStandalone: boolean;
  attackRollOverride: string[];
  attackMeleeBonusOverride: string;
  attackRangeBonusOverride: string;
  attackThrowBonusOverride: string;
  defenceMeleeBonusOverride: string;
  defenceRangeBonusOverride: string;
  gridAttackBonusOverride: string;
  gridDefenceBonusOverride: string;
  effectiveRangeOverride: string;
  maxRangeOverride: string;
  damageTypesOverride: string[];
  damageDiceTypeOverride: string;
  damageNumberOfDiceOverride: string;
  imageKeyOverride: string;
};

export type UniqueItemDraftScope =
  | { kind: "character"; id: string }
  | { kind: "game"; id: string };

const UNIQUE_ITEM_DRAFT_VERSION = 1;

const SOURCE_TYPES: UniqueItemDraftSourceType[] = [
  "GLOBAL_ITEM",
  "CUSTOM_ITEM",
  "STANDALONE",
];

function uniqueItemDraftFlow(scope: UniqueItemDraftScope): string {
  return scope.kind === "character"
    ? "character-unique-item-draft"
    : "game-unique-item-draft";
}

export function uniqueItemDraftStorageKey(scope: UniqueItemDraftScope): string {
  return buildModalDraftStorageKey(
    uniqueItemDraftFlow(scope),
    UNIQUE_ITEM_DRAFT_VERSION,
    scope.id
  );
}

function parseSourceType(v: unknown): UniqueItemDraftSourceType | null {
  if (
    typeof v === "string" &&
    SOURCE_TYPES.includes(v as UniqueItemDraftSourceType)
  ) {
    return v as UniqueItemDraftSourceType;
  }
  return null;
}

function normaliseUniqueItemDraft(
  parsed: Record<string, unknown>
): UniqueItemDraft | null {
  const sourceType = parseSourceType(parsed.sourceType);
  if (!sourceType) return null;

  const selectedTemplateId =
    typeof parsed.selectedTemplateId === "string"
      ? parsed.selectedTemplateId
      : null;

  return {
    sourceType,
    selectedTemplateId,
    nameOverride: draftStrField(parsed.nameOverride),
    descriptionOverride: draftStrField(parsed.descriptionOverride),
    notesOverride: draftStrField(parsed.notesOverride),
    usageOverride: draftStrField(parsed.usageOverride),
    costInfoOverride: draftStrField(parsed.costInfoOverride),
    confCostOverride: draftStrField(parsed.confCostOverride),
    weightOverride: draftStrField(parsed.weightOverride),
    specialTag: draftStrField(parsed.specialTag),
    equippableOverride: draftBoolOrEmptyField(parsed.equippableOverride),
    equipSlotTypesOverride: draftStringArrayField(
      parsed.equipSlotTypesOverride
    ),
    equipSlotCostOverride: draftStrField(parsed.equipSlotCostOverride),
    maxUsesOverride: draftStrField(parsed.maxUsesOverride),
    modifiesAttributeOverride: draftStrField(parsed.modifiesAttributeOverride),
    attributeModOverride: draftStrField(parsed.attributeModOverride),
    modifiesSkillOverride: draftStrField(parsed.modifiesSkillOverride),
    skillModOverride: draftStrField(parsed.skillModOverride),
    isSpeedAlteredOverride: draftBoolOrEmptyField(
      parsed.isSpeedAlteredOverride
    ),
    isSpeedAlteredStandalone: parsed.isSpeedAlteredStandalone === true,
    attackRollOverride: draftStringArrayField(parsed.attackRollOverride),
    attackMeleeBonusOverride: draftStrField(parsed.attackMeleeBonusOverride),
    attackRangeBonusOverride: draftStrField(parsed.attackRangeBonusOverride),
    attackThrowBonusOverride: draftStrField(parsed.attackThrowBonusOverride),
    defenceMeleeBonusOverride: draftStrField(parsed.defenceMeleeBonusOverride),
    defenceRangeBonusOverride: draftStrField(parsed.defenceRangeBonusOverride),
    gridAttackBonusOverride: draftStrField(parsed.gridAttackBonusOverride),
    gridDefenceBonusOverride: draftStrField(parsed.gridDefenceBonusOverride),
    effectiveRangeOverride: draftStrField(parsed.effectiveRangeOverride),
    maxRangeOverride: draftStrField(parsed.maxRangeOverride),
    damageTypesOverride: draftStringArrayField(parsed.damageTypesOverride),
    damageDiceTypeOverride: draftStrField(parsed.damageDiceTypeOverride),
    damageNumberOfDiceOverride: draftStrField(
      parsed.damageNumberOfDiceOverride
    ),
    imageKeyOverride: draftStrField(parsed.imageKeyOverride),
  };
}

export function isMeaningfulUniqueItemDraft(draft: UniqueItemDraft): boolean {
  if (draft.imageKeyOverride.trim()) return true;
  if (draft.selectedTemplateId) return true;
  if (draft.sourceType === "STANDALONE") {
    if (draft.nameOverride.trim() || draft.weightOverride.trim()) return true;
  }
  if (
    draftHasNonEmptyScalars([
      draft.nameOverride,
      draft.descriptionOverride,
      draft.notesOverride,
      draft.usageOverride,
      draft.costInfoOverride,
      draft.confCostOverride,
      draft.weightOverride,
      draft.specialTag,
      draft.equipSlotCostOverride,
      draft.maxUsesOverride,
      draft.modifiesAttributeOverride,
      draft.attributeModOverride,
      draft.modifiesSkillOverride,
      draft.skillModOverride,
      draft.attackMeleeBonusOverride,
      draft.attackRangeBonusOverride,
      draft.attackThrowBonusOverride,
      draft.defenceMeleeBonusOverride,
      draft.defenceRangeBonusOverride,
      draft.gridAttackBonusOverride,
      draft.gridDefenceBonusOverride,
      draft.effectiveRangeOverride,
      draft.maxRangeOverride,
      draft.damageDiceTypeOverride,
      draft.damageNumberOfDiceOverride,
    ])
  ) {
    return true;
  }
  if (draft.equippableOverride !== "") return true;
  if (draft.isSpeedAlteredOverride !== "") return true;
  if (draft.isSpeedAlteredStandalone) return true;
  if (draft.equipSlotTypesOverride.length > 0) return true;
  if (draft.attackRollOverride.length > 0) return true;
  if (draft.damageTypesOverride.length > 0) return true;
  return false;
}

export function readUniqueItemDraft(
  scope: UniqueItemDraftScope
): UniqueItemDraft | null {
  return readModalSessionDraft({
    storageKey: uniqueItemDraftStorageKey(scope),
    version: UNIQUE_ITEM_DRAFT_VERSION,
    normalize: normaliseUniqueItemDraft,
    isMeaningful: isMeaningfulUniqueItemDraft,
  });
}

export function persistUniqueItemDraft(
  scope: UniqueItemDraftScope,
  draft: UniqueItemDraft
): void {
  persistModalSessionDraft({
    storageKey: uniqueItemDraftStorageKey(scope),
    version: UNIQUE_ITEM_DRAFT_VERSION,
    draft,
    isMeaningful: isMeaningfulUniqueItemDraft,
  });
}

export function clearUniqueItemDraft(scope: UniqueItemDraftScope): void {
  clearModalSessionDraft(uniqueItemDraftStorageKey(scope));
}
