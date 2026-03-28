import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { CharacterDetail } from "@/app/lib/types/character";
import {
  levelUpCharacter,
  type LevelUpAttributePath,
  type LevelUpGeneralSkill,
} from "@/lib/api/character";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { getInnateAttributeValueForPath } from "./character-helpers";
import {
  ATTRIBUTE_GROUP_LABELS,
  ATTRIBUTE_OPTIONS,
  LEVEL_UP_FORM_DEFAULTS,
  SKILL_LABEL_BY_KEY,
} from "./constants";
import {
  clearLevelUpDraft,
  persistLevelUpDraft,
  readLevelUpDraft,
} from "./draft-storage";
import type {
  FeatureChoice,
  FeatureChoiceMode,
  FeatureOption,
  LevelUpFormValues,
  PathOption,
} from "./types";

export function useCharacterLevelUp(id: string, character: CharacterDetail) {
  const router = useRouter();
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

  const targetLevel = (character.generalInformation.level ?? 0) + 1;
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
            character.innateAttributes[
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
      Object.entries(character.learnedSkills.generalSkills ?? {})
        .map(([key, value]) => ({
          label: SKILL_LABEL_BY_KEY.get(key as LevelUpGeneralSkill) ?? key,
          value,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [character.learnedSkills.generalSkills]
  );

  const healthPreview = useMemo(() => {
    const current = character.health;
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
  }, [character.health, rolledMental, rolledPhysical]);

  useLayoutEffect(() => {
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
    if (!draftPersistEnabledRef.current) return;
    persistLevelUpDraft(
      id,
      character.generalInformation.level,
      currentStepIndex,
      activeFeatureSlot,
      persistedFormValues
    );
  }, [id, character, persistedFormValues, currentStepIndex, activeFeatureSlot]);

  useEffect(() => {
    if (seriousFlag !== "yes") return;
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
          `/api/paths/${encodeURIComponent(watchedPathId)}/available-features?rank=${encodeURIComponent(String(targetLevel))}`
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
    for (const feature of character.features ?? []) {
      map.set(feature.feature.id, {
        grade: feature.grade,
        maxGrade: feature.feature.maxGrade,
      });
    }
    return map;
  }, [character.features]);

  const existingPathIds = useMemo(
    () => new Set((character.paths ?? []).map((p) => p.id)),
    [character.paths]
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

  return {
    form,
    currentStepIndex,
    setCurrentStepIndex,
    validateStep,
    onSubmit,
    submitError,
    submitSuccess,
    isSubmitting,
    openQuickCheck,
    setOpenQuickCheck,
    targetLevel,
    seriousFlag,
    attributeError,
    healthError,
    choicesError,
    attributeSwapFromOptions,
    attributeSwapToOptions,
    healthPreview,
    watchedPathId,
    choices,
    pathOptions,
    loadingPaths,
    loadingFeatures,
    selectedPathInfo,
    isSelectedPathNew,
    alternativeNewPathOptions,
    activeFeatureSlot,
    setActiveFeatureSlot,
    features,
    existingFeatureById,
    setFeatureChoiceAtSlot,
    groupedAttributesForDisplay,
    currentSkillsForDisplay,
  };
}
