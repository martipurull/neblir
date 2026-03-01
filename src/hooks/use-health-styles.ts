"use client";

export interface HealthStyleSet {
  borderClassName: string | undefined;
  valueClassName: string;
}

function getHealthStylesForRatio(current: number, max: number): HealthStyleSet {
  if (max <= 0) {
    return {
      borderClassName: undefined,
      valueClassName: "text-neblirSafe-600",
    };
  }
  const ratio = current / max;
  if (ratio >= 1) {
    return {
      borderClassName: undefined,
      valueClassName: "text-neblirSafe-600",
    };
  }
  if (ratio >= 0.5) {
    return {
      borderClassName: "border-neblirWarning-200",
      valueClassName: "text-neblirWarning-400",
    };
  }
  return {
    borderClassName: "border-neblirDanger-200",
    valueClassName: "text-neblirDanger-400",
  };
}

export interface HealthStylesInput {
  currentPhysical: number;
  maxPhysical: number;
  currentMental: number;
  maxMental: number;
}

export function useHealthStyles({
  currentPhysical,
  maxPhysical,
  currentMental,
  maxMental,
}: HealthStylesInput) {
  return {
    physicalStyles: getHealthStylesForRatio(currentPhysical, maxPhysical),
    mentalStyles: getHealthStylesForRatio(currentMental, maxMental),
  };
}
