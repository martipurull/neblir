"use client";

import React from "react";
import { Stepper } from "@/app/components/shared/Stepper";
import { useFormContext } from "react-hook-form";
import { BackstoryStep } from "../../create/steps/BackstoryStep";
import { GeneralInfoStep } from "../../create/steps/GeneralInfoStep";
import { AttributesStep } from "../../create/steps/AttributesStep";
import { HealthStep } from "../../create/steps/HealthStep";
import { LearnedSkillsStep } from "../../create/steps/LearnedSkillsStep";
import { PathAndFeaturesStep } from "../../create/steps/PathAndFeaturesStep";
import { useCharacterUpdateController } from "./useCharacterUpdateController";
import type { CharacterUpdateFormValues } from "./schemas";
import Button from "@/app/components/shared/Button";
import DangerConfirmModal from "@/app/components/shared/DangerConfirmModal";

export function CharacterUpdateFormContent() {
  const {
    steps,
    currentStepIndex,
    isLastStep,
    isSubmitting,
    submitError,
    submitSuccess,
    initialFeatures,
    setInitialFeatures,
    showLevelDecreaseConfirm,
    hasBlockingLevelIssues,
    onConfirmLevelDecrease,
    onCancelLevelDecrease,
    goToStep,
    onBack,
    onNext,
    onSubmit,
  } = useCharacterUpdateController();
  const { handleSubmit } = useFormContext<CharacterUpdateFormValues>();

  return (
    <>
      <Stepper
        steps={steps}
        currentStepIndex={currentStepIndex}
        onStepClick={goToStep}
        className="mb-8"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(onSubmit)(e);
        }}
        className="flex flex-col gap-6"
      >
        {currentStepIndex === 0 && <BackstoryStep />}
        {currentStepIndex === 1 && <GeneralInfoStep />}
        {currentStepIndex === 2 && <AttributesStep />}
        {currentStepIndex === 3 && <HealthStep clampOnBlur={false} />}
        {currentStepIndex === 4 && <LearnedSkillsStep />}
        {currentStepIndex === 5 && (
          <PathAndFeaturesStep
            onInitialFeaturesChange={setInitialFeatures}
            initialFeatures={initialFeatures}
          />
        )}

        {submitError && (
          <p className="text-sm text-neblirDanger-600" role="alert">
            {submitError}
          </p>
        )}
        {submitSuccess && (
          <p className="text-sm text-neblirSafe-600" role="status">
            Character updated successfully.
          </p>
        )}
        {currentStepIndex !== 1 && (
          <p className="text-xs text-black/60">
            You can jump between steps in any order. If you lower level, you may
            need to manually fix health, skills, and feature grades before
            saving.
          </p>
        )}
        {hasBlockingLevelIssues && (
          <p className="text-xs text-neblirDanger-600" role="alert">
            Save is disabled until level-based constraints are fixed (health,
            skills, features).
          </p>
        )}

        <div className="flex gap-3">
          {currentStepIndex > 0 ? (
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              className="flex-1"
              onClick={onBack}
            >
              Back
            </Button>
          ) : (
            <div className="flex-1" />
          )}

          {!isLastStep ? (
            <Button
              type="button"
              variant="primary"
              fullWidth={false}
              className="flex-1"
              onClick={onNext}
            >
              Next
            </Button>
          ) : (
            <div className="flex-1">
              <Button
                type="submit"
                text={isSubmitting ? "Saving..." : "Save changes"}
                disabled={isSubmitting || hasBlockingLevelIssues}
              />
            </div>
          )}
        </div>
      </form>
      <DangerConfirmModal
        isOpen={showLevelDecreaseConfirm}
        title="Lower level may invalidate allocations"
        description="Your new level reduces limits for rolled health, learned skill points, and feature slots. Values will not be auto-trimmed; you must adjust them manually before saving."
        confirmLabel="Continue and adjust manually"
        cancelLabel="Keep editing"
        onCancel={onCancelLevelDecrease}
        onConfirm={onConfirmLevelDecrease}
        variant="modalBackground"
      />
    </>
  );
}
