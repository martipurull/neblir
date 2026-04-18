"use client";

import React from "react";
import Button from "@/app/components/shared/Button";

type CharacterCreateFooterProps = {
  currentStepIndex: number;
  isLastStep: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
};

function blurAfterStepAction(
  e: React.MouseEvent<HTMLButtonElement> | React.PointerEvent<HTMLButtonElement>
) {
  e.currentTarget.blur();
}

export function CharacterCreateFooter({
  currentStepIndex,
  isLastStep,
  isSubmitting,
  onBack,
  onNext,
}: CharacterCreateFooterProps) {
  return (
    <div className="flex gap-3">
      {currentStepIndex > 0 ? (
        <Button
          type="button"
          variant="secondary"
          fullWidth={false}
          className="flex-1"
          onClick={(e) => {
            blurAfterStepAction(e);
            onBack();
          }}
          onMouseDown={(e) => e.preventDefault()}
          onPointerDown={(e) => e.preventDefault()}
          onMouseUp={blurAfterStepAction}
          onKeyUp={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              (e.currentTarget as HTMLButtonElement).blur();
            }
          }}
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
          suppressHydrationWarning
          onClick={(e) => {
            blurAfterStepAction(e);
            onNext();
          }}
          onMouseDown={(e) => e.preventDefault()}
          onPointerDown={(e) => e.preventDefault()}
          onMouseUp={blurAfterStepAction}
          onKeyUp={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              (e.currentTarget as HTMLButtonElement).blur();
            }
          }}
        >
          Next
        </Button>
      ) : (
        <div className="flex-1">
          <Button
            type="submit"
            text={isSubmitting ? "Creating…" : "Create character"}
          />
        </div>
      )}
    </div>
  );
}
