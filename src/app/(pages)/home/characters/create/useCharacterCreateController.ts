"use client";

import type { z } from "zod";
import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { characterCreationRequestSchema } from "@/app/api/characters/schemas";
import { createCharacter } from "@/lib/api/character";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { InitialFeatureEntry } from "./steps/PathAndFeaturesStep";
import {
  CREATE_CHARACTER_DRAFT_KEY,
  CREATE_CHARACTER_FEATURES_DRAFT_KEY,
  CREATE_CHARACTER_STEP_DRAFT_KEY,
} from "./characterCreateDraft";

function setZodErrors(
  setError: UseFormSetError<CharacterCreationRequest>,
  error: z.ZodError
) {
  for (const issue of error.issues) {
    const path = issue.path.join(".") as keyof CharacterCreationRequest &
      string;
    if (path) setError(path as never, { message: issue.message });
  }
}

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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [initialFeatures, setInitialFeatures] = useState<InitialFeatureEntry[]>(
    []
  );

  const { getValues, setError, clearErrors } =
    useFormContext<CharacterCreationRequest>();

  // Restore step index on refresh.
  React.useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist current step index.
  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        CREATE_CHARACTER_STEP_DRAFT_KEY,
        JSON.stringify(currentStepIndex)
      );
    } catch {
      // ignore
    }
  }, [currentStepIndex]);

  // Rehydrate feature selection on refresh.
  React.useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist feature selection whenever it changes.
  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        CREATE_CHARACTER_FEATURES_DRAFT_KEY,
        JSON.stringify(initialFeatures)
      );
    } catch {
      // ignore
    }
  }, [initialFeatures]);

  const scrollToTop = () => {
    const el = document.getElementById("app-scroll");
    if (el) {
      el.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateCurrentStep = useCallback((): boolean => {
    clearErrors();
    const values = getValues();

    if (currentStepIndex === 0) return true;

    if (currentStepIndex === 1) {
      const res =
        characterCreationRequestSchema.shape.generalInformation.safeParse(
          values.generalInformation
        );
      if (!res.success) {
        setZodErrors(setError, res.error);
        return false;
      }

      const walletRes = characterCreationRequestSchema.shape.wallet.safeParse(
        values.wallet
      );
      if (!walletRes.success) {
        setZodErrors(setError, walletRes.error);
        return false;
      }
      return true;
    }

    if (currentStepIndex === 2) {
      const res =
        characterCreationRequestSchema.shape.innateAttributes.safeParse(
          values.innateAttributes
        );
      if (!res.success) {
        setZodErrors(setError, res.error);
        return false;
      }

      const groups = Object.values(values.innateAttributes ?? {});
      const sum = groups.reduce((acc, g) => {
        const groupSum = Object.values(g as Record<string, number>).reduce(
          (a, v) => a + v,
          0
        );
        return acc + groupSum;
      }, 0);

      if (sum > 36) {
        setError("innateAttributes" as never, {
          message: "Innate attributes sum cannot exceed 36.",
        });
        return false;
      }
      return true;
    }

    if (currentStepIndex === 3) {
      const level = values.generalInformation?.level ?? 1;
      const healthRes = characterCreationRequestSchema.shape.health.safeParse(
        values.health
      );
      if (!healthRes.success) {
        setZodErrors(setError, healthRes.error);
        return false;
      }

      const maxRolled = 10 * level;
      // Rolling rule:
      // Level 1 = 10
      // Level N = 10 + (N-1)d10, so the minimum is when all d10 are 1s:
      // minRolled = 10 + (N-1)*1 = N + 9
      const minRolled = 10 + Math.max(0, level - 1);
      const rolledPhysical = values.health?.rolledPhysicalHealth ?? 10;
      const rolledMental = values.health?.rolledMentalHealth ?? 10;

      if (rolledPhysical < minRolled || rolledPhysical > maxRolled) {
        setError("health.rolledPhysicalHealth" as never, {
          message: `Physical HP looks too low for level ${level}. Please roll physical HP (min ${minRolled}, max ${maxRolled}).`,
        });
        return false;
      }

      if (rolledMental < minRolled || rolledMental > maxRolled) {
        setError("health.rolledMentalHealth" as never, {
          message: `Mental HP looks too low for level ${level}. Please roll mental HP (min ${minRolled}, max ${maxRolled}).`,
        });
        return false;
      }

      return true;
    }

    if (currentStepIndex === 4) {
      const res = characterCreationRequestSchema.shape.learnedSkills.safeParse(
        values.learnedSkills
      );
      if (!res.success) {
        setZodErrors(setError, res.error);
        return false;
      }

      const level = values.generalInformation?.level ?? 1;
      const filledSpecial =
        values.learnedSkills?.specialSkills?.filter((s) => s?.trim()).length ??
        0;

      const learnedSkillsMax = 13 + level + (3 - filledSpecial);
      const sum = Object.values(
        values.learnedSkills?.generalSkills ?? {}
      ).reduce((acc, v) => acc + (v === 5 ? 6 : v), 0);

      if (sum > learnedSkillsMax) {
        setError("learnedSkills.generalSkills" as never, {
          message: `Learned skills exceed maximum (${learnedSkillsMax}).`,
        });
        return false;
      }
      return true;
    }

    if (currentStepIndex === 5) {
      if (!values.path?.pathId?.trim()) {
        setError("path.pathId" as never, { message: "Please select a path" });
        return false;
      }
      return true;
    }

    return true;
  }, [clearErrors, currentStepIndex, getValues, setError]);

  const onNext = useCallback(() => {
    if (!validateCurrentStep()) {
      scrollToTop();
      return;
    }
    setCurrentStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }, [validateCurrentStep]);

  const onBack = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(0, i - 1));
    setSubmitError(null);
    scrollToTop();
  }, []);

  React.useEffect(() => {
    scrollToTop();
    requestAnimationFrame(() => {
      const el = document.activeElement;
      if (el instanceof HTMLElement) el.blur();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex]);

  const onSubmit = useCallback(
    async (values: CharacterCreationRequest) => {
      setSubmitError(null);
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
        };

        const character = await createCharacter(body);

        try {
          window.localStorage.removeItem(CREATE_CHARACTER_DRAFT_KEY);
          window.localStorage.removeItem(CREATE_CHARACTER_FEATURES_DRAFT_KEY);
          window.localStorage.removeItem(CREATE_CHARACTER_STEP_DRAFT_KEY);
        } catch {
          // ignore
        }

        router.push(`/home/characters/${character.id}`);
      } catch (e) {
        setSubmitError(
          getUserSafeErrorMessage(e, "Failed to create character")
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [initialFeatures, router]
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
    onBack,
    onNext,
    onSubmit,
  };
}
