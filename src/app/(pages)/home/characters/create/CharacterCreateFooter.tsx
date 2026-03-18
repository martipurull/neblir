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
        <button
          type="button"
          onClick={(e) => {
            (e.currentTarget as HTMLButtonElement).blur();
            onBack();
          }}
          onMouseDown={(e) => e.preventDefault()}
          onPointerDown={(e) => e.preventDefault()}
          onMouseUp={(e) => (e.currentTarget as HTMLButtonElement).blur()}
          onKeyUp={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              (e.currentTarget as HTMLButtonElement).blur();
            }
          }}
          className="min-h-11 flex-1 rounded-md border-2 border-black/30 px-4 py-2 text-black transition-colors hover:border-black/50"
        >
          Back
        </button>
      ) : (
        <div className="flex-1" />
      )}

      {!isLastStep ? (
        <button
          type="button"
          onClick={(e) => {
            (e.currentTarget as HTMLButtonElement).blur();
            onNext();
          }}
          suppressHydrationWarning
          onMouseDown={(e) => e.preventDefault()}
          onPointerDown={(e) => e.preventDefault()}
          onMouseUp={(e) => (e.currentTarget as HTMLButtonElement).blur()}
          onKeyUp={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              (e.currentTarget as HTMLButtonElement).blur();
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
            text={isSubmitting ? "Creating…" : "Create character"}
          />
        </div>
      )}
    </div>
  );
}
