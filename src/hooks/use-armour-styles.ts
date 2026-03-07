// eslint-disable-next-line no-unused-expressions
"use client";

export interface ArmourStyleSet {
  borderClassName: string | undefined;
  valueClassName: string | undefined;
  subValueClassName: string;
}

export function useArmourStyles(
  currentHP: number,
  maxHP: number
): ArmourStyleSet {
  if (maxHP <= 0) {
    return {
      borderClassName: undefined,
      valueClassName: undefined,
      subValueClassName: "text-black",
    };
  }
  const ratio = currentHP / maxHP;
  if (ratio >= 1) {
    return {
      borderClassName: undefined,
      valueClassName: "text-neblirSafe-600",
      subValueClassName: "text-black",
    };
  }
  if (ratio >= 0.5) {
    return {
      borderClassName: "border-neblirWarning-400",
      valueClassName: "text-neblirWarning-600",
      subValueClassName: "text-black",
    };
  }
  return {
    borderClassName: "border-neblirDanger-400",
    valueClassName: "text-neblirDanger-600",
    subValueClassName: "text-black",
  };
}
