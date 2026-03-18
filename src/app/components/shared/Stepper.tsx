"use client";

import React from "react";

export interface StepperStep {
  id: string;
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  currentStepIndex: number;
  className?: string;
}

export function Stepper({
  steps,
  currentStepIndex,
  className = "",
}: StepperProps) {
  return (
    <nav className={className} aria-label="Progress">
      <ol className="mx-auto flex w-full max-w-2xl items-start">
        {steps.map((step, index) => {
          const isComplete = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          return (
            <li
              key={step.id}
              className="flex flex-1 flex-col items-center min-w-0"
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="flex w-full items-center justify-center">
                <div
                  className={`flex-1 shrink border-b ${
                    isFirst ? "border-transparent" : "border-black/20"
                  }`}
                  style={{ minHeight: 0, marginBottom: "0.6rem" }}
                  aria-hidden
                />
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors ${
                    isComplete
                      ? "border-customPrimary bg-customPrimary text-customSecondary"
                      : isCurrent
                        ? "border-customPrimary bg-transparent text-customPrimary"
                        : "border-black/30 bg-transparent text-black/50"
                  }`}
                  aria-hidden
                >
                  {isComplete ? "✓" : index + 1}
                </span>
                <div
                  className={`flex-1 shrink border-b ${
                    isLast ? "border-transparent" : "border-black/20"
                  }`}
                  style={{ minHeight: 0, marginBottom: "0.6rem" }}
                  aria-hidden
                />
              </div>
              <span
                className={`mt-1 text-center text-xs leading-tight ${
                  isCurrent
                    ? "font-medium text-black"
                    : isComplete
                      ? "text-black/80"
                      : "text-black/50"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
