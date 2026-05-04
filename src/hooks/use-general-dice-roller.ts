"use client";

import {
  COMMON_DICE_OPTIONS,
  getSidesFromDieOption,
  rollDie,
} from "@/app/lib/general-dice";
import { useCallback, useState } from "react";

export type GeneralDiceRollerRoll = {
  results: number[];
  total: number;
  diceExpression: string;
};

function canRollGeneralDice(diceCount: number, diceType: number): boolean {
  return (
    Number.isInteger(diceCount) &&
    Number.isInteger(diceType) &&
    diceCount > 0 &&
    diceType > 1
  );
}

export function useGeneralDiceRollerState() {
  const [diceCount, setDiceCount] = useState(1);
  const [diceType, setDiceType] = useState(10);
  const [diceTypeMode, setDiceTypeMode] = useState<"quick" | "advanced">(
    "quick"
  );
  const [advancedDiceOption, setAdvancedDiceOption] = useState("d10");
  const [customSides, setCustomSides] = useState(10);
  const [note, setNote] = useState("");
  const [rollResult, setRollResult] = useState<number[] | null>(null);

  const canRoll = canRollGeneralDice(diceCount, diceType);

  const reset = useCallback(() => {
    setDiceCount(1);
    setDiceType(10);
    setDiceTypeMode("quick");
    setAdvancedDiceOption("d10");
    setCustomSides(10);
    setNote("");
    setRollResult(null);
  }, []);

  const setDiceTypeAndClearResult = useCallback((nextSides: number) => {
    setDiceType(nextSides);
    setRollResult(null);
  }, []);

  const decreaseDiceCount = useCallback(() => {
    setDiceCount((current) => Math.max(1, current - 1));
    setRollResult(null);
  }, []);

  const increaseDiceCount = useCallback(() => {
    setDiceCount((current) => current + 1);
    setRollResult(null);
  }, []);

  const applyDiceCountFromInput = useCallback((raw: string) => {
    setDiceCount(Math.max(0, Math.trunc(Number(raw) || 0)));
    setRollResult(null);
  }, []);

  const handleAdvancedDiceOptionChange = useCallback(
    (value: string) => {
      setAdvancedDiceOption(value);
      if (value === "custom") {
        const clamped = Math.max(2, customSides);
        setCustomSides(clamped);
        setDiceType(clamped);
        setRollResult(null);
        return;
      }
      const sides = getSidesFromDieOption(value);
      if (!sides) return;
      setDiceType(sides);
      setRollResult(null);
    },
    [customSides]
  );

  const handleEnableAdvancedDice = useCallback(() => {
    setDiceTypeMode("advanced");
    const asCommonOption = `d${diceType}`;
    const isCommon = COMMON_DICE_OPTIONS.some(
      (o) => o.value === asCommonOption
    );
    if (isCommon) {
      setAdvancedDiceOption(asCommonOption);
      return;
    }
    setAdvancedDiceOption("custom");
    setCustomSides(Math.max(2, diceType));
  }, [diceType]);

  const handleReturnToQuickDice = useCallback(() => {
    setDiceTypeMode("quick");
    setDiceType((current) => {
      if (current === 6 || current === 10) return current;
      setRollResult(null);
      return 10;
    });
  }, []);

  const adjustCustomSidesBy = useCallback(
    (delta: number) => {
      const next =
        delta < 0 ? Math.max(2, customSides + delta) : customSides + delta;
      setCustomSides(next);
      setDiceType(next);
      setRollResult(null);
    },
    [customSides]
  );

  const applyCustomSidesFromInput = useCallback((raw: string) => {
    const next = Math.max(0, Math.trunc(Number(raw) || 0));
    setCustomSides(next);
    setDiceType(next);
    setRollResult(null);
  }, []);

  const tryExecuteRoll = useCallback((): GeneralDiceRollerRoll | null => {
    if (!canRollGeneralDice(diceCount, diceType)) return null;
    const results = Array.from({ length: diceCount }, () =>
      rollDie(diceType)
    ).sort((a, b) => b - a);
    const total = results.reduce((sum, value) => sum + value, 0);
    setRollResult(results);
    return {
      results,
      total,
      diceExpression: `${diceCount}d${diceType}`,
    };
  }, [diceCount, diceType]);

  return {
    COMMON_DICE_OPTIONS,
    diceCount,
    diceType,
    diceTypeMode,
    advancedDiceOption,
    customSides,
    note,
    setNote,
    rollResult,
    canRoll,
    reset,
    setDiceTypeAndClearResult,
    decreaseDiceCount,
    increaseDiceCount,
    applyDiceCountFromInput,
    handleAdvancedDiceOptionChange,
    handleEnableAdvancedDice,
    handleReturnToQuickDice,
    adjustCustomSidesBy,
    applyCustomSidesFromInput,
    tryExecuteRoll,
  };
}
