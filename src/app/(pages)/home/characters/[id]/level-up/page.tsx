"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import PageSubtitle from "@/app/components/shared/PageSubtitle";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import Button from "@/app/components/shared/Button";
import { WarningButton } from "@/app/components/shared/SemanticActionButton";
import { Stepper } from "@/app/components/shared/Stepper";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import { useCharacter } from "@/hooks/use-character";
import {
  levelUpCharacter,
  type LevelUpAttributePath,
  type LevelUpGeneralSkill,
} from "@/lib/api/character";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { CharacterDetail } from "@/app/lib/types/character";

type PathOption = {
  id: string;
  name: string;
  description: string | null;
  baseFeature: string;
};
type FeatureOption = {
  id: string;
  name: string;
  maxGrade: number;
  minPathRank: number;
  description?: string | null;
};
type FeatureChoiceMode = "none" | "new" | "increment";
type FeatureChoice = { mode: FeatureChoiceMode; featureId: string };
type LevelUpFormValues = {
  hasSeriousInjuryOrTrauma: "yes" | "no" | "";
  fromAttribute: LevelUpAttributePath | "";
  toAttribute: LevelUpAttributePath | "";
  rolledPhysicalHealth: number;
  rolledMentalHealth: number;
  skillImprovement: LevelUpGeneralSkill | "";
  pathId: string;
  choices: [FeatureChoice, FeatureChoice];
};

const STEPS = [
  { id: "attr", label: "Attributes" },
  { id: "health", label: "Health" },
  { id: "skill", label: "Skill" },
  { id: "path", label: "Path & Features" },
];
const FEATURE_SLOT_INDEXES = [0, 1] as const;

const LEVEL_UP_DRAFT_VERSION = 1;

const LEVEL_UP_FORM_DEFAULTS: LevelUpFormValues = {
  hasSeriousInjuryOrTrauma: "",
  fromAttribute: "",
  toAttribute: "",
  rolledPhysicalHealth: 1,
  rolledMentalHealth: 1,
  skillImprovement: "",
  pathId: "",
  choices: [
    { mode: "none", featureId: "" },
    { mode: "none", featureId: "" },
  ],
};

function levelUpDraftStorageKey(characterId: string) {
  return `neblir:level-up-draft:v${LEVEL_UP_DRAFT_VERSION}:${characterId}`;
}

function clearLevelUpDraft(characterId: string) {
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

function normalizeDraftValues(v: unknown): LevelUpFormValues | null {
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

function readLevelUpDraft(
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
    const values = normalizeDraftValues(parsed.values);
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

const ATTRIBUTE_OPTIONS: { value: LevelUpAttributePath; label: string }[] = [
  {
    value: "intelligence.investigation",
    label: "Intelligence - Investigation",
  },
  { value: "intelligence.memory", label: "Intelligence - Memory" },
  { value: "intelligence.deduction", label: "Intelligence - Deduction" },
  { value: "wisdom.sense", label: "Wisdom - Sense" },
  { value: "wisdom.perception", label: "Wisdom - Perception" },
  { value: "wisdom.insight", label: "Wisdom - Insight" },
  { value: "personality.persuasion", label: "Personality - Persuasion" },
  { value: "personality.deception", label: "Personality - Deception" },
  { value: "personality.mentality", label: "Personality - Mentality" },
  { value: "strength.athletics", label: "Strength - Athletics" },
  { value: "strength.resilience", label: "Strength - Resilience" },
  { value: "strength.bruteForce", label: "Strength - Brute Force" },
  { value: "dexterity.manual", label: "Dexterity - Manual" },
  { value: "dexterity.stealth", label: "Dexterity - Stealth" },
  { value: "dexterity.agility", label: "Dexterity - Agility" },
  {
    value: "constitution.resistanceInternal",
    label: "Constitution - Resistance (Internal)",
  },
  {
    value: "constitution.resistanceExternal",
    label: "Constitution - Resistance (External)",
  },
  { value: "constitution.stamina", label: "Constitution - Stamina" },
];

const GENERAL_SKILL_OPTIONS: { value: LevelUpGeneralSkill; label: string }[] = [
  { value: "mechanics", label: "Mechanics" },
  { value: "software", label: "Software" },
  { value: "generalKnowledge", label: "General Knowledge" },
  { value: "history", label: "History" },
  { value: "driving", label: "Driving" },
  { value: "acrobatics", label: "Acrobatics" },
  { value: "aim", label: "Aim" },
  { value: "melee", label: "Melee" },
  { value: "GRID", label: "GRID" },
  { value: "research", label: "Research" },
  { value: "medicine", label: "Medicine" },
  { value: "science", label: "Science" },
  { value: "survival", label: "Survival" },
  { value: "streetwise", label: "Streetwise" },
  { value: "performance", label: "Performance" },
  {
    value: "manipulationNegotiation",
    label: "Manipulation & Negotiation",
  },
];
const SKILL_LABEL_BY_KEY = new Map(
  GENERAL_SKILL_OPTIONS.map((option) => [option.value, option.label] as const)
);
const ATTRIBUTE_GROUP_LABELS = {
  intelligence: "Intelligence",
  wisdom: "Wisdom",
  personality: "Personality",
  strength: "Strength",
  dexterity: "Dexterity",
  constitution: "Constitution",
} as const;

function rollD10() {
  return Math.floor(Math.random() * 10) + 1;
}

function getInnateAttributeValueForPath(
  character: CharacterDetail,
  path: LevelUpAttributePath
): number {
  const [group, key] = path.split(".") as [string, string];
  const value =
    (
      character.innateAttributes[
        group as keyof typeof character.innateAttributes
      ] as Record<string, number> | undefined
    )?.[key] ?? 0;
  return value;
}

export default function CharacterLevelUpPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { character, loading, error, refetch } = useCharacter(id);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [paths, setPaths] = useState<PathOption[]>([]);
  const [features, setFeatures] = useState<FeatureOption[]>([]);
  const [loadingPaths, setLoadingPaths] = useState(false);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFeatureSlot, setActiveFeatureSlot] = useState<0 | 1>(0);
  const [openQuickCheck, setOpenQuickCheck] = useState<
    null | "attributes" | "skills"
  >(null);

  const draftHydrateKeyRef = useRef<string | null>(null);
  const draftPersistEnabledRef = useRef(false);

  const form = useForm<LevelUpFormValues>({
    defaultValues: LEVEL_UP_FORM_DEFAULTS,
    mode: "onTouched",
  });

  const targetLevel = (character?.generalInformation.level ?? 0) + 1;
  const watchedPathId = form.watch("pathId");
  const choices = form.watch("choices");
  const seriousFlag = form.watch("hasSeriousInjuryOrTrauma");
  const attributeError =
    form.formState.errors.fromAttribute?.message ??
    form.formState.errors.toAttribute?.message;
  const healthError =
    form.formState.errors.rolledPhysicalHealth?.message ??
    form.formState.errors.rolledMentalHealth?.message;
  const choicesError =
    form.formState.errors.choices?.message ??
    form.formState.errors.choices?.[0]?.featureId?.message ??
    form.formState.errors.choices?.[1]?.featureId?.message;
  const rolledPhysical = form.watch("rolledPhysicalHealth");
  const rolledMental = form.watch("rolledMentalHealth");

  const currentAttributesForDisplay = useMemo(
    () =>
      ATTRIBUTE_OPTIONS.map((option) => {
        const [group, key] = option.value.split(".") as [string, string];
        const value =
          (
            character?.innateAttributes[
              group as keyof typeof character.innateAttributes
            ] as Record<string, number> | undefined
          )?.[key] ?? 0;
        return { label: option.label, value };
      }),
    [character]
  );
  const groupedAttributesForDisplay = useMemo(() => {
    const grouped = new Map<
      keyof typeof ATTRIBUTE_GROUP_LABELS,
      Array<{ label: string; value: number }>
    >();
    for (const entry of currentAttributesForDisplay) {
      const rawGroup = entry.label.split(" - ")[0].toLowerCase();
      const groupKey =
        rawGroup in ATTRIBUTE_GROUP_LABELS
          ? (rawGroup as keyof typeof ATTRIBUTE_GROUP_LABELS)
          : "intelligence";
      const list = grouped.get(groupKey) ?? [];
      list.push({
        label: entry.label.split(" - ")[1] ?? entry.label,
        value: entry.value,
      });
      grouped.set(groupKey, list);
    }
    return grouped;
  }, [currentAttributesForDisplay]);

  const attributeSwapFromOptions = useMemo(() => {
    const rest = ATTRIBUTE_OPTIONS.map((option) => {
      if (!character) {
        return { value: option.value, label: option.label };
      }
      const current = getInnateAttributeValueForPath(character, option.value);
      if (current <= 1) {
        return {
          value: option.value,
          label: option.label,
          disabled: true as const,
          disabledHint: "(cannot go below 1)",
        };
      }
      return { value: option.value, label: option.label };
    });
    return [{ value: "", label: "No attribute moved" }, ...rest];
  }, [character]);

  const attributeSwapToOptions = useMemo(() => {
    const rest = ATTRIBUTE_OPTIONS.map((option) => {
      if (!character) {
        return { value: option.value, label: option.label };
      }
      const current = getInnateAttributeValueForPath(character, option.value);
      if (current >= 5) {
        return {
          value: option.value,
          label: option.label,
          disabled: true as const,
          disabledHint: "(cannot go above 5)",
        };
      }
      return { value: option.value, label: option.label };
    });
    return [{ value: "", label: "No attribute moved" }, ...rest];
  }, [character]);

  const currentSkillsForDisplay = useMemo(
    () =>
      Object.entries(character?.learnedSkills.generalSkills ?? {})
        .map(([key, value]) => ({
          label: SKILL_LABEL_BY_KEY.get(key as LevelUpGeneralSkill) ?? key,
          value,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [character?.learnedSkills.generalSkills]
  );
  const healthPreview = useMemo(() => {
    const current = character?.health;
    if (!current) return null;
    const safePhysical = Number.isFinite(rolledPhysical) ? rolledPhysical : 0;
    const safeMental = Number.isFinite(rolledMental) ? rolledMental : 0;
    return {
      currentPhysical: current.currentPhysicalHealth,
      currentPhysicalMax: current.maxPhysicalHealth,
      nextPhysical: current.currentPhysicalHealth + safePhysical,
      nextPhysicalMax: current.maxPhysicalHealth + safePhysical,
      currentMental: current.currentMentalHealth,
      currentMentalMax: current.maxMentalHealth,
      nextMental: current.currentMentalHealth + safeMental,
      nextMentalMax: current.maxMentalHealth + safeMental,
    };
  }, [character?.health, rolledMental, rolledPhysical]);

  useLayoutEffect(() => {
    if (!id || !character) return;
    const hydrateKey = `${id}:${character.generalInformation.level}`;
    if (draftHydrateKeyRef.current === hydrateKey) return;
    draftHydrateKeyRef.current = hydrateKey;

    const draft = readLevelUpDraft(id, character.generalInformation.level);
    if (draft) {
      form.reset(draft.values);
      setCurrentStepIndex(draft.stepIndex);
      setActiveFeatureSlot(draft.activeFeatureSlot);
    } else {
      form.reset({
        ...LEVEL_UP_FORM_DEFAULTS,
        pathId: character.paths?.[0]?.id ?? "",
      });
    }
    draftPersistEnabledRef.current = true;
  }, [id, character, form]);

  const persistedFormValues = form.watch();
  useEffect(() => {
    if (!id || !character || !draftPersistEnabledRef.current) return;
    try {
      sessionStorage.setItem(
        levelUpDraftStorageKey(id),
        JSON.stringify({
          v: LEVEL_UP_DRAFT_VERSION,
          characterLevel: character.generalInformation.level,
          stepIndex: currentStepIndex,
          activeFeatureSlot,
          values: persistedFormValues,
        })
      );
    } catch {
      /* quota / private mode */
    }
  }, [id, character, persistedFormValues, currentStepIndex, activeFeatureSlot]);

  useEffect(() => {
    if (seriousFlag !== "yes" || !character) return;
    const from = form.getValues("fromAttribute");
    if (
      from &&
      getInnateAttributeValueForPath(character, from as LevelUpAttributePath) <=
        1
    ) {
      form.setValue("fromAttribute", "", { shouldDirty: true });
    }
    const to = form.getValues("toAttribute");
    if (
      to &&
      getInnateAttributeValueForPath(character, to as LevelUpAttributePath) >= 5
    ) {
      form.setValue("toAttribute", "", { shouldDirty: true });
    }
  }, [character, seriousFlag, form]);

  useEffect(() => {
    let cancelled = false;
    setLoadingPaths(true);
    const run = async () => {
      try {
        const r = await fetch("/api/paths");
        const data = (await r.json()) as PathOption[];
        if (!cancelled) setPaths(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setPaths([]);
      } finally {
        if (!cancelled) setLoadingPaths(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!watchedPathId || !targetLevel) {
      setFeatures([]);
      return;
    }
    let cancelled = false;
    setLoadingFeatures(true);
    const run = async () => {
      try {
        const r = await fetch(
          `/api/paths/${encodeURIComponent(watchedPathId)}/available-features?rank=${encodeURIComponent(targetLevel)}`
        );
        const data = (await r.json()) as FeatureOption[];
        if (!cancelled) {
          setFeatures(
            Array.isArray(data)
              ? data.slice().sort((a, b) => a.name.localeCompare(b.name))
              : []
          );
        }
      } catch {
        if (!cancelled) setFeatures([]);
      } finally {
        if (!cancelled) setLoadingFeatures(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [targetLevel, watchedPathId]);

  useEffect(() => {
    if (!features.length) return;
    const validIds = new Set(features.map((f) => f.id));
    const current = form.getValues("choices");
    let changed = false;
    const next = current.map((c) => {
      if (c.featureId && !validIds.has(c.featureId)) {
        changed = true;
        return { ...c, featureId: "" };
      }
      return c;
    }) as [FeatureChoice, FeatureChoice];
    if (changed) {
      form.setValue("choices", next, { shouldDirty: true });
    }
  }, [features, form]);

  const pathOptions = useMemo(
    () =>
      paths.map((p) => ({
        value: p.id,
        label: p.name.replace(/_/g, " "),
      })),
    [paths]
  );

  const existingFeatureById = useMemo(() => {
    const map = new Map<string, { grade: number; maxGrade: number }>();
    for (const feature of character?.features ?? []) {
      map.set(feature.feature.id, {
        grade: feature.grade,
        maxGrade: feature.feature.maxGrade,
      });
    }
    return map;
  }, [character?.features]);
  const existingPathIds = useMemo(
    () => new Set((character?.paths ?? []).map((p) => p.id)),
    [character?.paths]
  );
  const isSelectedPathNew = Boolean(
    watchedPathId && !existingPathIds.has(watchedPathId)
  );
  const selectedPathInfo = useMemo(
    () => paths.find((p) => p.id === watchedPathId) ?? null,
    [paths, watchedPathId]
  );
  const alternativeNewPathOptions = useMemo(
    () =>
      paths.filter((p) => !existingPathIds.has(p.id) && p.id !== watchedPathId),
    [existingPathIds, paths, watchedPathId]
  );

  const newFeatureOptions = useMemo(
    () =>
      features
        .filter((f) => !existingFeatureById.has(f.id))
        .map((f) => ({
          value: f.id,
          label: `${f.name} (new)`,
        })),
    [existingFeatureById, features]
  );
  const incrementFeatureOptions = useMemo(
    () =>
      features
        .filter((f) => {
          const existing = existingFeatureById.get(f.id);
          return existing && existing.grade < f.maxGrade;
        })
        .map((f) => {
          const existing = existingFeatureById.get(f.id);
          return {
            value: f.id,
            label: `${f.name} (${existing?.grade ?? 0}/${f.maxGrade})`,
          };
        }),
    [existingFeatureById, features]
  );

  const validateStep = (stepIndex: number): boolean => {
    form.clearErrors();
    const values = form.getValues();
    if (stepIndex === 0) {
      if (!values.hasSeriousInjuryOrTrauma) {
        form.setError("hasSeriousInjuryOrTrauma", {
          message:
            "Please answer whether the character had serious injury/trauma.",
        });
        return false;
      }
      if (values.hasSeriousInjuryOrTrauma === "yes") {
        const hasFrom = Boolean(values.fromAttribute);
        const hasTo = Boolean(values.toAttribute);
        if (hasFrom !== hasTo) {
          form.setError("fromAttribute", {
            message:
              "Pick both From and To attributes, or leave both empty for no change.",
          });
          return false;
        }
        if (hasFrom && values.fromAttribute === values.toAttribute) {
          form.setError("toAttribute", {
            message: "From and To attributes must be different.",
          });
          return false;
        }
      }
      return true;
    }
    if (stepIndex === 1) {
      const checks: Array<
        ["rolledPhysicalHealth" | "rolledMentalHealth", number]
      > = [
        ["rolledPhysicalHealth", values.rolledPhysicalHealth],
        ["rolledMentalHealth", values.rolledMentalHealth],
      ];
      for (const [field, value] of checks) {
        if (!Number.isInteger(value) || value < 1 || value > 10) {
          form.setError(field, {
            message: "Roll must be an integer between 1 and 10.",
          });
          return false;
        }
      }
      return true;
    }
    if (stepIndex === 2) {
      if (!values.skillImprovement) {
        form.setError("skillImprovement", {
          message: "Please choose the skill that gains +1.",
        });
        return false;
      }
      return true;
    }
    if (stepIndex === 3) {
      if (!values.pathId) {
        form.setError("pathId", { message: "Please choose a path." });
        return false;
      }
      const picked = values.choices.filter((c) => c.mode !== "none");
      if (picked.length !== 2) {
        form.setError("choices", {
          message:
            "You must apply exactly two feature upgrades (new, increment, or one of each).",
        });
        return false;
      }
      const dedupe = new Set<string>();
      for (const [index, choice] of values.choices.entries()) {
        const featureField =
          index === 0 ? "choices.0.featureId" : "choices.1.featureId";
        if (choice.mode === "none") continue;
        if (!choice.featureId) {
          form.setError(featureField, {
            message: "Choose a feature for this slot.",
          });
          return false;
        }
        if (choice.mode === "new") {
          if (!newFeatureOptions.some((f) => f.value === choice.featureId)) {
            form.setError(featureField, {
              message: "This feature cannot be picked as new.",
            });
            return false;
          }
        }
        if (choice.mode === "increment") {
          if (
            !incrementFeatureOptions.some((f) => f.value === choice.featureId)
          ) {
            form.setError(featureField, {
              message: "This feature cannot be incremented.",
            });
            return false;
          }
        }
        const key = `${choice.mode}:${choice.featureId}`;
        if (dedupe.has(key)) {
          form.setError("choices", {
            message: "Duplicate feature upgrade selections are not allowed.",
          });
          return false;
        }
        dedupe.add(key);
      }
      return true;
    }
    return true;
  };

  const setFeatureChoiceAtSlot = (
    slot: 0 | 1,
    mode: FeatureChoiceMode,
    featureId: string
  ) => {
    form.setValue(`choices.${slot}.mode`, mode, { shouldDirty: true });
    form.setValue(`choices.${slot}.featureId`, featureId, {
      shouldDirty: true,
    });
    form.clearErrors(["choices", "choices.0.featureId", "choices.1.featureId"]);

    const otherSlot: 0 | 1 = slot === 0 ? 1 : 0;
    const other = form.getValues(`choices.${otherSlot}`);
    // Smooth UX: after choosing one slot, jump to the other if it is still empty.
    if (!other || other.mode === "none" || !other.featureId) {
      setActiveFeatureSlot(otherSlot);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    let firstInvalid: number | null = null;
    for (const step of [0, 1, 2, 3]) {
      if (!validateStep(step)) {
        firstInvalid = step;
        break;
      }
    }
    if (firstInvalid !== null) {
      setCurrentStepIndex(firstInvalid ?? 0);
      return;
    }
    if (!id) return;
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(true);
    try {
      const attributeChanges =
        values.hasSeriousInjuryOrTrauma === "yes" &&
        values.fromAttribute &&
        values.toAttribute
          ? [{ from: values.fromAttribute, to: values.toAttribute }]
          : undefined;
      const newFeatureIds = values.choices
        .filter((c) => c.mode === "new")
        .map((c) => c.featureId);
      const incrementalFeatureIds = values.choices
        .filter((c) => c.mode === "increment")
        .map((c) => c.featureId);

      await levelUpCharacter(id, {
        healthUpdate: {
          rolledPhysicalHealth: values.rolledPhysicalHealth,
          rolledMentalHealth: values.rolledMentalHealth,
        },
        pathId: values.pathId,
        skillImprovement: values.skillImprovement as LevelUpGeneralSkill,
        newFeatureIds,
        incrementalFeatureIds,
        attributeChanges,
      });
      setSubmitSuccess(true);
      clearLevelUpDraft(id);
      router.push(`/home/characters/${id}`);
    } catch (e) {
      setSubmitError(
        getUserSafeErrorMessage(e, "Failed to level up character")
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  if (id == null) {
    return (
      <PageSection>
        <p className="text-sm text-neblirDanger-600">Invalid character.</p>
      </PageSection>
    );
  }
  if (loading) {
    return (
      <PageSection>
        <LoadingState text="Loading character..." />
      </PageSection>
    );
  }
  if (error || !character) {
    return (
      <PageSection>
        <ErrorState
          message={error ?? "Character not found"}
          onRetry={refetch}
          retryLabel="Retry"
        />
      </PageSection>
    );
  }

  return (
    <PageSection>
      <div className="mb-3 flex justify-center">
        <WarningButton
          type="button"
          onClick={() => {
            clearLevelUpDraft(id);
            router.push(`/home/characters/${id}`);
          }}
          className="text-xs"
        >
          Exit to character page
        </WarningButton>
      </div>
      <PageTitle>Level Up Character</PageTitle>
      <PageSubtitle>
        Levelling up from level {character.generalInformation.level} to{" "}
        {targetLevel}.
      </PageSubtitle>
      <p className="mt-2 mb-6 text-sm text-black/70">
        All level-based effects are calculated for level {targetLevel}.
      </p>

      <Stepper
        steps={STEPS}
        currentStepIndex={currentStepIndex}
        onStepClick={(step) => setCurrentStepIndex(step)}
        className="mb-8"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(e);
        }}
        className="flex flex-col gap-6"
      >
        {currentStepIndex === 0 && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setOpenQuickCheck("attributes")}
              className="rounded border border-black/30 px-3 py-1.5 text-sm text-black transition-colors hover:border-black/50"
            >
              Check current attributes
            </button>
            <p className="text-sm text-black/70">
              Has the character sustained a serious injury or serious trauma?
            </p>
            <RadioGroup
              name="hasSeriousInjuryOrTrauma"
              value={seriousFlag}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              onChange={(value) =>
                form.setValue(
                  "hasSeriousInjuryOrTrauma",
                  value as LevelUpFormValues["hasSeriousInjuryOrTrauma"],
                  {
                    shouldDirty: true,
                  }
                )
              }
            />
            {form.formState.errors.hasSeriousInjuryOrTrauma?.message && (
              <p className="text-sm text-neblirDanger-600" role="alert">
                {form.formState.errors.hasSeriousInjuryOrTrauma.message}
              </p>
            )}

            {seriousFlag === "yes" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectDropdown
                  id="attribute-from"
                  label="From"
                  placeholder="No attribute moved"
                  value={form.watch("fromAttribute")}
                  options={attributeSwapFromOptions}
                  pinValueFirst=""
                  onChange={(v) =>
                    form.setValue(
                      "fromAttribute",
                      v as LevelUpFormValues["fromAttribute"],
                      {
                        shouldDirty: true,
                      }
                    )
                  }
                />
                <SelectDropdown
                  id="attribute-to"
                  label="To"
                  placeholder="No attribute moved"
                  value={form.watch("toAttribute")}
                  options={attributeSwapToOptions}
                  pinValueFirst=""
                  onChange={(v) =>
                    form.setValue(
                      "toAttribute",
                      v as LevelUpFormValues["toAttribute"],
                      {
                        shouldDirty: true,
                      }
                    )
                  }
                />
              </div>
            )}
            {attributeError && (
              <p className="text-sm text-neblirDanger-600" role="alert">
                {attributeError}
              </p>
            )}
          </div>
        )}

        {currentStepIndex === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-black/70">
              Roll +1d10 for physical and +1d10 for mental health. These values
              are added to both max and current health.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded border border-black/20 p-3">
                <p className="mb-2 font-medium">Physical health roll</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    {...form.register("rolledPhysicalHealth", {
                      valueAsNumber: true,
                    })}
                    className="w-24 rounded border border-black/30 px-2 py-1"
                  />
                  <button
                    type="button"
                    className="rounded border border-black/30 px-2 py-1 text-sm"
                    onClick={() =>
                      form.setValue("rolledPhysicalHealth", rollD10(), {
                        shouldDirty: true,
                      })
                    }
                  >
                    Roll d10
                  </button>
                </div>
                {healthPreview && (
                  <div className="mt-2 flex items-center gap-2 rounded border border-black/15 bg-transparent px-2 py-1.5 text-xs">
                    <div className="flex-1">
                      <p className="text-[10px] uppercase tracking-wide text-black/50">
                        Current health
                      </p>
                      <p className="font-medium text-black/80">
                        {healthPreview.currentPhysical} /{" "}
                        {healthPreview.currentPhysicalMax}
                      </p>
                    </div>
                    <span className="text-sm text-black/50" aria-hidden>
                      →
                    </span>
                    <div className="flex-1 text-right">
                      <p className="text-[10px] uppercase tracking-wide text-black/50">
                        After level-up
                      </p>
                      <p className="font-semibold text-black">
                        {healthPreview.nextPhysical} /{" "}
                        {healthPreview.nextPhysicalMax}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded border border-black/20 p-3">
                <p className="mb-2 font-medium">Mental health roll</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    {...form.register("rolledMentalHealth", {
                      valueAsNumber: true,
                    })}
                    className="w-24 rounded border border-black/30 px-2 py-1"
                  />
                  <button
                    type="button"
                    className="rounded border border-black/30 px-2 py-1 text-sm"
                    onClick={() =>
                      form.setValue("rolledMentalHealth", rollD10(), {
                        shouldDirty: true,
                      })
                    }
                  >
                    Roll d10
                  </button>
                </div>
                {healthPreview && (
                  <div className="mt-2 flex items-center gap-2 rounded border border-black/15 bg-transparent px-2 py-1.5 text-xs">
                    <div className="flex-1">
                      <p className="text-[10px] uppercase tracking-wide text-black/50">
                        Current health
                      </p>
                      <p className="font-medium text-black/80">
                        {healthPreview.currentMental} /{" "}
                        {healthPreview.currentMentalMax}
                      </p>
                    </div>
                    <span className="text-sm text-black/50" aria-hidden>
                      →
                    </span>
                    <div className="flex-1 text-right">
                      <p className="text-[10px] uppercase tracking-wide text-black/50">
                        After level-up
                      </p>
                      <p className="font-semibold text-black">
                        {healthPreview.nextMental} /{" "}
                        {healthPreview.nextMentalMax}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {healthError && (
              <p className="text-sm text-neblirDanger-600" role="alert">
                {healthError}
              </p>
            )}
          </div>
        )}

        {currentStepIndex === 2 && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setOpenQuickCheck("skills")}
              className="rounded border border-black/30 px-3 py-1.5 text-sm text-black transition-colors hover:border-black/50"
            >
              Check current skill points
            </button>
            <p className="text-sm text-black/70">
              Choose one learned skill to improve by +1 at level {targetLevel}.
            </p>
            <SelectDropdown
              id="skill-improvement"
              label="Skill to improve"
              placeholder="Select one skill"
              value={form.watch("skillImprovement")}
              options={GENERAL_SKILL_OPTIONS}
              onChange={(v) =>
                form.setValue("skillImprovement", v as LevelUpGeneralSkill, {
                  shouldDirty: true,
                })
              }
            />
            {form.formState.errors.skillImprovement?.message && (
              <p className="text-sm text-neblirDanger-600" role="alert">
                {form.formState.errors.skillImprovement.message}
              </p>
            )}
          </div>
        )}

        {currentStepIndex === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-black/70">
              Choose a path to advance (existing or new), then apply exactly two
              feature upgrades.
            </p>
            <SelectDropdown
              id="path-id"
              label="Path"
              placeholder={loadingPaths ? "Loading paths..." : "Select a path"}
              value={watchedPathId}
              options={pathOptions}
              disabled={loadingPaths}
              onChange={(v) =>
                form.setValue("pathId", v, { shouldDirty: true })
              }
            />
            {form.formState.errors.pathId?.message && (
              <p className="text-sm text-neblirDanger-600" role="alert">
                {form.formState.errors.pathId.message}
              </p>
            )}
            {selectedPathInfo && (
              <div className="rounded border border-black/20 bg-black/5 p-2 text-sm">
                <p className="font-medium">
                  Selected path: {selectedPathInfo.name.replace(/_/g, " ")}
                </p>
                <p className="mt-1 text-black/70">
                  Base feature: {selectedPathInfo.baseFeature}
                </p>
                {selectedPathInfo.description && (
                  <p className="mt-1 text-black/70">
                    {selectedPathInfo.description}
                  </p>
                )}
              </div>
            )}
            {isSelectedPathNew && alternativeNewPathOptions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-black">
                  Other new path options
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {alternativeNewPathOptions.map((path) => (
                    <button
                      key={path.id}
                      type="button"
                      onClick={() =>
                        form.setValue("pathId", path.id, { shouldDirty: true })
                      }
                      className="rounded border border-black/20 bg-transparent p-3 text-left transition-colors hover:border-black/40"
                    >
                      <p className="font-semibold text-black">
                        {path.name.replace(/_/g, " ")}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-black/55">
                        Base feature
                      </p>
                      <p className="text-sm text-black">{path.baseFeature}</p>
                      {path.description && (
                        <p className="mt-2 text-sm text-black/70 line-clamp-4">
                          {path.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {loadingFeatures && (
              <p className="text-sm text-black/60">
                Loading feature options...
              </p>
            )}
            <div className="space-y-3 rounded border border-black/20 p-3">
              <p className="text-sm font-medium text-black">
                Feature upgrade slots (pick 2)
              </p>
              <div className="flex gap-2">
                {FEATURE_SLOT_INDEXES.map((idx) => {
                  const isActive = activeFeatureSlot === idx;
                  const slotChoice = choices[idx];
                  const featureName = features.find(
                    (f) => f.id === slotChoice?.featureId
                  )?.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveFeatureSlot(idx)}
                      className={`flex-1 rounded border-2 px-2 py-2 text-left text-sm ${
                        isActive
                          ? "border-customPrimary bg-customPrimary/10 shadow-sm"
                          : "border-black/20 bg-transparent"
                      }`}
                    >
                      <p className="font-semibold">Slot {idx + 1}</p>
                      <p className="text-xs text-black/70">
                        {slotChoice?.mode === "none" || !slotChoice?.featureId
                          ? "Not selected"
                          : `${slotChoice.mode === "new" ? "New" : "Increase"}: ${featureName ?? slotChoice.featureId}`}
                      </p>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="rounded border border-black/30 px-2 py-1 text-xs text-black hover:border-black/50"
                onClick={() => {
                  setFeatureChoiceAtSlot(activeFeatureSlot, "none", "");
                  form.clearErrors([
                    "choices",
                    "choices.0.featureId",
                    "choices.1.featureId",
                  ]);
                }}
              >
                Clear active slot
              </button>
            </div>

            <div className="space-y-2">
              {features.map((feature) => {
                const existing = existingFeatureById.get(feature.id);
                const canPickNew = !existing;
                const canIncrease = Boolean(
                  existing && existing.grade < feature.maxGrade
                );
                const selectedSlotIndexes = FEATURE_SLOT_INDEXES.filter(
                  (slotIdx) =>
                    choices[slotIdx]?.featureId === feature.id &&
                    choices[slotIdx]?.mode !== "none"
                );
                const isSelected = selectedSlotIndexes.length > 0;
                return (
                  <div
                    key={feature.id}
                    className={`rounded border-2 p-3 ${
                      isSelected
                        ? "border-customPrimary bg-customPrimary/5"
                        : "border-black/20"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-black">{feature.name}</p>
                      {selectedSlotIndexes.map((slotIdx) => {
                        const mode = choices[slotIdx]?.mode;
                        return (
                          <span
                            key={`${feature.id}-slot-${slotIdx}`}
                            className="rounded-full border border-customPrimary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-customPrimary"
                          >
                            Slot {slotIdx + 1}{" "}
                            {mode === "new" ? "new" : "increase"}
                          </span>
                        );
                      })}
                      <span className="text-xs text-black/60">
                        Max grade: {feature.maxGrade}
                      </span>
                      {existing ? (
                        <span className="text-xs text-black/60">
                          Current grade: {existing.grade}
                        </span>
                      ) : (
                        <span className="text-xs text-black/60">
                          Not learned yet
                        </span>
                      )}
                    </div>
                    {feature.description && (
                      <p className="mt-1 text-sm text-black/70">
                        {feature.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!canPickNew}
                        onClick={() =>
                          setFeatureChoiceAtSlot(
                            activeFeatureSlot,
                            "new",
                            feature.id
                          )
                        }
                        className="rounded border border-neblirSafe-400 px-2 py-1 text-xs text-neblirSafe-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Pick as new
                      </button>
                      <button
                        type="button"
                        disabled={!canIncrease}
                        onClick={() =>
                          setFeatureChoiceAtSlot(
                            activeFeatureSlot,
                            "increment",
                            feature.id
                          )
                        }
                        className="rounded border border-customPrimary px-2 py-1 text-xs text-customPrimary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Increase grade
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {choicesError && (
              <p className="text-sm text-neblirDanger-600" role="alert">
                {choicesError}
              </p>
            )}
          </div>
        )}

        {submitError && (
          <p className="text-sm text-neblirDanger-600" role="alert">
            {submitError}
          </p>
        )}
        {submitSuccess && (
          <p className="text-sm text-neblirSafe-600" role="status">
            Character levelled up successfully.
          </p>
        )}

        <div className="flex gap-3">
          {currentStepIndex > 0 ? (
            <button
              type="button"
              onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
              className="min-h-11 flex-1 rounded-md border-2 border-black/30 px-4 py-2 text-black transition-colors hover:border-black/50"
            >
              Back
            </button>
          ) : (
            <div className="flex-1" />
          )}
          {currentStepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                if (validateStep(currentStepIndex)) {
                  setCurrentStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
                }
              }}
              className="min-h-11 flex-1 rounded-md bg-customPrimary px-4 py-2 text-customSecondary transition-colors hover:bg-customPrimaryHover"
            >
              Next
            </button>
          ) : (
            <div className="flex-1">
              <Button
                type="submit"
                text={isSubmitting ? "Levelling up..." : "Level up"}
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>
      </form>

      {openQuickCheck && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded border border-black/20 bg-modalBackground-200 p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-black">
                {openQuickCheck === "attributes" && "Current attributes"}
                {openQuickCheck === "skills" && "Current skills"}
              </h2>
              <button
                type="button"
                onClick={() => setOpenQuickCheck(null)}
                className="rounded px-2 py-1 text-sm text-black/70 hover:bg-black/10"
              >
                Close
              </button>
            </div>

            {openQuickCheck === "attributes" && (
              <div className="max-h-80 overflow-y-auto bg-transparent p-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    Object.keys(ATTRIBUTE_GROUP_LABELS) as Array<
                      keyof typeof ATTRIBUTE_GROUP_LABELS
                    >
                  ).map((groupKey) => {
                    const items =
                      groupedAttributesForDisplay.get(groupKey) ?? [];
                    return (
                      <div
                        key={groupKey}
                        className="rounded border border-black/20 bg-transparent p-2"
                      >
                        <p className="mb-2 text-sm font-semibold text-black">
                          {ATTRIBUTE_GROUP_LABELS[groupKey]}
                        </p>
                        <div className="space-y-1">
                          {items.map((item) => (
                            <div
                              key={`${groupKey}-${item.label}`}
                              className="flex items-center justify-between rounded px-2 py-1 text-sm"
                            >
                              <span className="text-black/80">
                                {item.label}
                              </span>
                              <span className="font-semibold text-black">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {openQuickCheck === "skills" && (
              <div className="max-h-80 space-y-1 overflow-y-auto rounded border border-black/15 bg-transparent p-2">
                {currentSkillsForDisplay.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded px-2 py-1 text-sm"
                  >
                    <span className="text-black/80">{item.label}</span>
                    <span className="font-semibold text-black">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageSection>
  );
}
