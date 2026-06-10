import {
  buildModalDraftStorageKey,
  clearModalSessionDraft,
  draftHasNonEmptyScalars,
  draftStrField,
  draftStringArrayField,
  isRecord,
  persistModalSessionDraft,
  readModalSessionDraft,
} from "@/app/components/games/modalSessionDraftStorage";

export type CustomEnemyActionDraft = {
  clientId: string;
  name: string;
  description: string;
  numberOfDiceToHit: string;
  numberOfDamageDice: string;
  damageDiceType: string;
  damageType: string;
  notes: string;
};

export type GameCustomEnemyDraft = {
  name: string;
  description: string;
  notes: string;
  health: string;
  speed: string;
  initiativeModifier: string;
  numberOfReactions: string;
  defenceMelee: string;
  defenceRange: string;
  defenceGrid: string;
  attackMelee: string;
  attackRange: string;
  attackThrow: string;
  attackGrid: string;
  actions: CustomEnemyActionDraft[];
  additionalActions: CustomEnemyActionDraft[];
  immunities: string[];
  resistances: string[];
  vulnerabilities: string[];
  imageKey: string;
};

const GAME_CUSTOM_ENEMY_DRAFT_VERSION = 1;

export function gameCustomEnemyDraftStorageKey(gameId: string): string {
  return buildModalDraftStorageKey(
    "game-custom-enemy-draft",
    GAME_CUSTOM_ENEMY_DRAFT_VERSION,
    gameId
  );
}

function normaliseActionDraft(raw: unknown): CustomEnemyActionDraft | null {
  if (!isRecord(raw)) return null;
  const clientId = draftStrField(raw.clientId);
  if (!clientId) return null;
  return {
    clientId,
    name: draftStrField(raw.name),
    description: draftStrField(raw.description),
    numberOfDiceToHit: draftStrField(raw.numberOfDiceToHit),
    numberOfDamageDice: draftStrField(raw.numberOfDamageDice),
    damageDiceType: draftStrField(raw.damageDiceType),
    damageType: draftStrField(raw.damageType),
    notes: draftStrField(raw.notes),
  };
}

function normaliseActionDraftList(raw: unknown): CustomEnemyActionDraft[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomEnemyActionDraft[] = [];
  for (const row of raw) {
    const parsed = normaliseActionDraft(row);
    if (parsed) out.push(parsed);
  }
  return out;
}

function normaliseGameCustomEnemyDraft(
  parsed: Record<string, unknown>
): GameCustomEnemyDraft | null {
  return {
    name: draftStrField(parsed.name),
    description: draftStrField(parsed.description),
    notes: draftStrField(parsed.notes),
    health: draftStrField(parsed.health),
    speed: draftStrField(parsed.speed),
    initiativeModifier: draftStrField(parsed.initiativeModifier),
    numberOfReactions: draftStrField(parsed.numberOfReactions),
    defenceMelee: draftStrField(parsed.defenceMelee),
    defenceRange: draftStrField(parsed.defenceRange),
    defenceGrid: draftStrField(parsed.defenceGrid),
    attackMelee: draftStrField(parsed.attackMelee),
    attackRange: draftStrField(parsed.attackRange),
    attackThrow: draftStrField(parsed.attackThrow),
    attackGrid: draftStrField(parsed.attackGrid),
    actions: normaliseActionDraftList(parsed.actions),
    additionalActions: normaliseActionDraftList(parsed.additionalActions),
    immunities: draftStringArrayField(parsed.immunities),
    resistances: draftStringArrayField(parsed.resistances),
    vulnerabilities: draftStringArrayField(parsed.vulnerabilities),
    imageKey: draftStrField(parsed.imageKey),
  };
}

function actionRowIsMeaningful(row: CustomEnemyActionDraft): boolean {
  return draftHasNonEmptyScalars([
    row.name,
    row.description,
    row.numberOfDiceToHit,
    row.numberOfDamageDice,
    row.damageDiceType,
    row.damageType,
    row.notes,
  ]);
}

export function isMeaningfulGameCustomEnemyDraft(
  draft: GameCustomEnemyDraft
): boolean {
  if (draft.imageKey.trim()) return true;
  if (
    draftHasNonEmptyScalars([
      draft.name,
      draft.description,
      draft.notes,
      draft.health,
      draft.speed,
      draft.initiativeModifier,
      draft.numberOfReactions,
      draft.defenceMelee,
      draft.defenceRange,
      draft.defenceGrid,
      draft.attackMelee,
      draft.attackRange,
      draft.attackThrow,
      draft.attackGrid,
    ])
  ) {
    return true;
  }
  if (draft.immunities.length > 0) return true;
  if (draft.resistances.length > 0) return true;
  if (draft.vulnerabilities.length > 0) return true;
  if (draft.actions.some(actionRowIsMeaningful)) return true;
  if (draft.additionalActions.some(actionRowIsMeaningful)) return true;
  return false;
}

export function readGameCustomEnemyDraft(
  gameId: string
): GameCustomEnemyDraft | null {
  return readModalSessionDraft({
    storageKey: gameCustomEnemyDraftStorageKey(gameId),
    version: GAME_CUSTOM_ENEMY_DRAFT_VERSION,
    normalize: normaliseGameCustomEnemyDraft,
    isMeaningful: isMeaningfulGameCustomEnemyDraft,
  });
}

export function persistGameCustomEnemyDraft(
  gameId: string,
  draft: GameCustomEnemyDraft
): void {
  persistModalSessionDraft({
    storageKey: gameCustomEnemyDraftStorageKey(gameId),
    version: GAME_CUSTOM_ENEMY_DRAFT_VERSION,
    draft,
    isMeaningful: isMeaningfulGameCustomEnemyDraft,
  });
}

export function clearGameCustomEnemyDraft(gameId: string): void {
  clearModalSessionDraft(gameCustomEnemyDraftStorageKey(gameId));
}
