"use client";

import { useCallback, useEffect, useState } from "react";
import type { z } from "zod";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import { characterCreationRequestSchema } from "@/app/api/characters/schemas";
import { updateCharacterEditableFields } from "@/lib/api/character";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { CharacterUpdateFormValues } from "./schemas";
import type { InitialFeatureEntry } from "../../create/steps/PathAndFeaturesStep";

const STEPS = [
  { id: "backstory", label: "Backstory" },
  { id: "general", label: "General" },
  { id: "attributes", label: "Attributes" },
  { id: "health", label: "Health" },
  { id: "skills", label: "Skills" },
  { id: "path", label: "Path" },
];

function setZodErrors(
  setError: UseFormSetError<CharacterUpdateFormValues>,
  error: z.ZodError
) {
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (path) setError(path as never, { message: issue.message });
  }
}

export function useCharacterUpdateController() {
  const router = useRouter();
  const params = useParams();
  const characterId = typeof params.id === "string" ? params.id : "";
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [initialFeatures, setInitialFeatures] = useState<InitialFeatureEntry[]>(
    []
  );

  const { getValues, setError, clearErrors, watch } =
    useFormContext<CharacterUpdateFormValues>();
  const watchedInitialFeatures = watch("initialFeatures");

  useEffect(() => {
    if (!Array.isArray(watchedInitialFeatures)) return;
    setInitialFeatures(
      watchedInitialFeatures.map((entry) => ({
        featureId: entry.featureId,
        grade: entry.grade,
      }))
    );
  }, [watchedInitialFeatures]);

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
      const minRolled = 10 + Math.max(0, level - 1);
      const rolledPhysical = values.health?.rolledPhysicalHealth ?? 10;
      const rolledMental = values.health?.rolledMentalHealth ?? 10;

      if (rolledPhysical < minRolled || rolledPhysical > maxRolled) {
        setError("health.rolledPhysicalHealth" as never, {
          message: `Physical rolled health must be between ${minRolled} and ${maxRolled} for level ${level}.`,
        });
        return false;
      }

      if (rolledMental < minRolled || rolledMental > maxRolled) {
        setError("health.rolledMentalHealth" as never, {
          message: `Mental rolled health must be between ${minRolled} and ${maxRolled} for level ${level}.`,
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
    setSubmitSuccess(false);
    if (!validateCurrentStep()) return;
    setCurrentStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }, [validateCurrentStep]);

  const onBack = useCallback(() => {
    setSubmitSuccess(false);
    setCurrentStepIndex((i) => Math.max(0, i - 1));
    setSubmitError(null);
  }, []);

  const onSubmit = useCallback(
    async (values: CharacterUpdateFormValues) => {
      setSubmitError(null);
      setSubmitSuccess(false);
      setIsSubmitting(true);
      try {
        await updateCharacterEditableFields(characterId, {
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
              : [],
          initialFeatures,
        });
        setSubmitSuccess(true);
        router.push(`/home/characters/${characterId}`);
      } catch (e) {
        setSubmitError(
          getUserSafeErrorMessage(e, "Failed to update character")
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [characterId, initialFeatures, router]
  );

  return {
    steps: STEPS,
    currentStepIndex,
    isLastStep: currentStepIndex === STEPS.length - 1,
    isSubmitting,
    submitError,
    submitSuccess,
    initialFeatures,
    setInitialFeatures,
    onBack,
    onNext,
    onSubmit,
  };
}
