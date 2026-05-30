"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormContext, useWatch } from "react-hook-form";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { createCharacter } from "@/lib/api/character";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { InitialFeatureEntry } from "./steps/PathAndFeaturesStep";
import {
  CREATE_CHARACTER_DRAFT_KEY,
  CREATE_CHARACTER_FEATURES_DRAFT_KEY,
  CREATE_CHARACTER_STEP_DRAFT_KEY,
} from "./characterCreateDraft";
import {
  applyCharacterCreationStepValidationErrors,
  getFirstInvalidCharacterCreationStep,
  isCharacterCreationFormSubmittable,
  isCharacterCreationStepValid,
} from "./characterCreationStepValidation";

function isInitialFeatureEntry(value: unknown): value is InitialFeatureEntry {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.featureId === "string" && typeof record.grade === "number"
  );
}

const STEPS = [
  { id: "backstory", label: "Backstory" },
  { id: "general", label: "General" },
  { id: "attributes", label: "Attributes" },
  { id: "health", label: "Health" },
  { id: "skills", label: "Skills" },
  { id: "path", label: "Path" },
];

export function useCharacterCreateController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const freshStart = searchParams.get("fresh") === "1";
  const linkGameId = searchParams.get("gameId");
  const returnTo = searchParams.get("returnTo");
  const gameLinkIsPublic =
    searchParams.get("gameLinkIsPublic") === "1" ||
    searchParams.get("gameLinkIsPublic") === "true";
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [initialFeatures, setInitialFeatures] = useState<InitialFeatureEntry[]>(
    []
  );

  const { control, getValues, setError, clearErrors } =
    useFormContext<CharacterCreationRequest>();
  const watchedValues = useWatch({ control }) as CharacterCreationRequest;

  const validationContext = useMemo(
    () => ({ initialFeatures }),
    [initialFeatures]
  );

  const canProceedFromCurrentStep = useMemo(
    () =>
      isCharacterCreationStepValid(
        currentStepIndex,
        watchedValues ?? getValues(),
        validationContext
      ),
    [currentStepIndex, getValues, validationContext, watchedValues]
  );

  const canSubmitCharacter = useMemo(
    () =>
      isCharacterCreationFormSubmittable(
        watchedValues ?? getValues(),
        validationContext
      ),
    [getValues, validationContext, watchedValues]
  );

  // Restore step index when resuming a draft (page refresh). Skip on ?fresh=1 so we
  // do not jump ahead before CreateCharacterPageClient clears localStorage.
  React.useEffect(() => {
    if (freshStart) {
      setCurrentStepIndex(0);
      return;
    }
    try {
      const raw = window.localStorage.getItem(CREATE_CHARACTER_STEP_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      const idx =
        typeof parsed === "number"
          ? parsed
          : typeof parsed === "string"
            ? Number.parseInt(parsed, 10)
            : NaN;
      if (!Number.isFinite(idx)) return;
      const clamped = Math.max(0, Math.min(STEPS.length - 1, idx));
      setCurrentStepIndex(clamped);
    } catch {
      // ignore
    }
  }, [freshStart]);

  // Persist current step index.
  React.useEffect(() => {
    if (freshStart) return;
    try {
      window.localStorage.setItem(
        CREATE_CHARACTER_STEP_DRAFT_KEY,
        JSON.stringify(currentStepIndex)
      );
    } catch {
      // ignore
    }
  }, [currentStepIndex, freshStart]);

  // Rehydrate feature selection on refresh.
  React.useEffect(() => {
    if (freshStart) {
      setInitialFeatures([]);
      return;
    }
    try {
      const raw = window.localStorage.getItem(
        CREATE_CHARACTER_FEATURES_DRAFT_KEY
      );
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;

      const safe = parsed
        .filter((e): e is InitialFeatureEntry => isInitialFeatureEntry(e))
        .map((e) => ({
          featureId: e.featureId,
          grade: Math.max(1, Math.floor(e.grade)),
        }));

      setInitialFeatures(safe);
    } catch {
      // ignore
    }
  }, [freshStart]);

  // Persist feature selection whenever it changes.
  React.useEffect(() => {
    if (freshStart) return;
    try {
      window.localStorage.setItem(
        CREATE_CHARACTER_FEATURES_DRAFT_KEY,
        JSON.stringify(initialFeatures)
      );
    } catch {
      // ignore
    }
  }, [initialFeatures, freshStart]);

  const scrollToTop = () => {
    const el = document.getElementById("app-scroll");
    if (el) {
      el.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateStepAt = useCallback(
    (stepIndex: number): boolean => {
      clearErrors();
      return applyCharacterCreationStepValidationErrors(
        stepIndex,
        getValues(),
        setError,
        validationContext
      );
    },
    [clearErrors, getValues, setError, validationContext]
  );

  const validateAllSteps = useCallback((): number | null => {
    clearErrors();
    const values = getValues();
    const firstInvalidStep = getFirstInvalidCharacterCreationStep(
      values,
      validationContext
    );
    if (firstInvalidStep === null) return null;

    applyCharacterCreationStepValidationErrors(
      firstInvalidStep,
      values,
      setError,
      validationContext
    );
    return firstInvalidStep;
  }, [clearErrors, getValues, setError, validationContext]);

  const onNext = useCallback(() => {
    if (!validateStepAt(currentStepIndex)) {
      scrollToTop();
      return;
    }
    setCurrentStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }, [currentStepIndex, validateStepAt]);

  const goToStep = useCallback(
    (targetStepIndex: number) => {
      const clampedTarget = Math.max(
        0,
        Math.min(STEPS.length - 1, targetStepIndex)
      );
      if (clampedTarget === currentStepIndex) return;

      if (!validateStepAt(currentStepIndex)) {
        scrollToTop();
        return;
      }

      setSubmitError(null);
      const values = getValues();

      if (clampedTarget > currentStepIndex) {
        for (
          let stepIndex = currentStepIndex + 1;
          stepIndex < clampedTarget;
          stepIndex++
        ) {
          if (
            !isCharacterCreationStepValid(stepIndex, values, validationContext)
          ) {
            applyCharacterCreationStepValidationErrors(
              stepIndex,
              values,
              setError,
              validationContext
            );
            setCurrentStepIndex(stepIndex);
            scrollToTop();
            return;
          }
        }
      }

      setCurrentStepIndex(clampedTarget);
    },
    [currentStepIndex, getValues, setError, validationContext, validateStepAt]
  );

  const onBack = useCallback(() => {
    goToStep(currentStepIndex - 1);
  }, [currentStepIndex, goToStep]);

  React.useEffect(() => {
    scrollToTop();
    requestAnimationFrame(() => {
      const el = document.activeElement;
      if (el instanceof HTMLElement) el.blur();
    });
  }, [currentStepIndex]);

  const submitCharacter = useCallback(
    async (values: CharacterCreationRequest) => {
      setSubmitError(null);
      const firstInvalidStep = validateAllSteps();
      if (firstInvalidStep !== null) {
        setCurrentStepIndex(firstInvalidStep);
        scrollToTop();
        return;
      }

      setIsSubmitting(true);
      try {
        const body = {
          ...values,
          learnedSkills: {
            ...values.learnedSkills,
            specialSkills:
              values.learnedSkills.specialSkills?.filter((s) => s?.trim()) ??
              [],
          },
          wallet:
            values.wallet && values.wallet.length > 0
              ? values.wallet.filter((e) => e.quantity > 0)
              : undefined,
          initialFeatures:
            initialFeatures.length > 0 ? initialFeatures : undefined,
          ...(linkGameId
            ? {
                gameId: linkGameId,
                gameLinkIsPublic: gameLinkIsPublic || undefined,
              }
            : {}),
        };

        const character = await createCharacter(body);

        try {
          window.localStorage.removeItem(CREATE_CHARACTER_DRAFT_KEY);
          window.localStorage.removeItem(CREATE_CHARACTER_FEATURES_DRAFT_KEY);
          window.localStorage.removeItem(CREATE_CHARACTER_STEP_DRAFT_KEY);
        } catch {
          // ignore
        }

        const safeReturnTo =
          returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
            ? returnTo
            : null;
        router.push(safeReturnTo ?? `/home/characters/${character.id}`);
      } catch (e) {
        setSubmitError(
          getUserSafeErrorMessage(e, "Failed to create character")
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      gameLinkIsPublic,
      initialFeatures,
      linkGameId,
      returnTo,
      router,
      validateAllSteps,
    ]
  );

  const isLastStep = currentStepIndex === STEPS.length - 1;

  return {
    steps: STEPS,
    currentStepIndex,
    isLastStep,
    isSubmitting,
    submitError,
    initialFeatures,
    setInitialFeatures,
    canProceedFromCurrentStep,
    canSubmitCharacter,
    goToStep,
    onBack,
    onNext,
    submitCharacter,
  };
}
