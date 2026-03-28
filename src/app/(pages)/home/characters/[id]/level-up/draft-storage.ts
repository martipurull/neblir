import { LEVEL_UP_FORM_DEFAULTS, STEPS } from "./constants";
import type { FeatureChoice, LevelUpFormValues } from "./types";

export const LEVEL_UP_DRAFT_VERSION = 1;

function levelUpDraftStorageKey(characterId: string) {
  return `neblir:level-up-draft:v${LEVEL_UP_DRAFT_VERSION}:${characterId}`;
}

export function clearLevelUpDraft(characterId: string) {
  try {
    sessionStorage.removeItem(levelUpDraftStorageKey(characterId));
  } catch {
    /* ignore */
  }
}

function clampLevelUpDiceRoll(n: unknown): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return 1;
  const r = Math.round(x);
  return Math.min(10, Math.max(1, r));
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function parseFeatureChoice(x: unknown): FeatureChoice | null {
  if (!isRecord(x)) return null;
  const { mode, featureId } = x;
  if (mode !== "none" && mode !== "new" && mode !== "increment") return null;
  if (typeof featureId !== "string") return null;
  return { mode, featureId };
}

function normaliseDraftValues(v: unknown): LevelUpFormValues | null {
  if (!isRecord(v)) return null;
  const ch = v.choices;
  if (!Array.isArray(ch) || ch.length < 2) return null;
  const c0 = parseFeatureChoice(ch[0]);
  const c1 = parseFeatureChoice(ch[1]);
  if (!c0 || !c1) return null;
  const inj = v.hasSeriousInjuryOrTrauma;
  return {
    ...LEVEL_UP_FORM_DEFAULTS,
    hasSeriousInjuryOrTrauma: inj === "yes" || inj === "no" ? inj : "",
    fromAttribute:
      typeof v.fromAttribute === "string"
        ? (v.fromAttribute as LevelUpFormValues["fromAttribute"])
        : "",
    toAttribute:
      typeof v.toAttribute === "string"
        ? (v.toAttribute as LevelUpFormValues["toAttribute"])
        : "",
    rolledPhysicalHealth: clampLevelUpDiceRoll(v.rolledPhysicalHealth),
    rolledMentalHealth: clampLevelUpDiceRoll(v.rolledMentalHealth),
    skillImprovement:
      typeof v.skillImprovement === "string"
        ? (v.skillImprovement as LevelUpFormValues["skillImprovement"])
        : "",
    pathId: typeof v.pathId === "string" ? v.pathId : "",
    choices: [c0, c1],
  };
}

export function readLevelUpDraft(
  characterId: string,
  characterLevel: number
): {
  values: LevelUpFormValues;
  stepIndex: number;
  activeFeatureSlot: 0 | 1;
} | null {
  const key = levelUpDraftStorageKey(characterId);
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      sessionStorage.removeItem(key);
      return null;
    }
    if (parsed.v !== LEVEL_UP_DRAFT_VERSION) {
      sessionStorage.removeItem(key);
      return null;
    }
    if (
      typeof parsed.characterLevel !== "number" ||
      parsed.characterLevel !== characterLevel
    ) {
      sessionStorage.removeItem(key);
      return null;
    }
    const values = normaliseDraftValues(parsed.values);
    if (!values) {
      sessionStorage.removeItem(key);
      return null;
    }
    const stepIndex = Math.min(
      Math.max(0, Math.floor(Number(parsed.stepIndex)) || 0),
      STEPS.length - 1
    );
    const activeFeatureSlot = parsed.activeFeatureSlot === 1 ? 1 : 0;
    return { values, stepIndex, activeFeatureSlot };
  } catch {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function persistLevelUpDraft(
  characterId: string,
  characterLevel: number,
  stepIndex: number,
  activeFeatureSlot: 0 | 1,
  values: LevelUpFormValues
): void {
  try {
    sessionStorage.setItem(
      levelUpDraftStorageKey(characterId),
      JSON.stringify({
        v: LEVEL_UP_DRAFT_VERSION,
        characterLevel,
        stepIndex,
        activeFeatureSlot,
        values,
      })
    );
  } catch {
    /* quota / private mode */
  }
}
