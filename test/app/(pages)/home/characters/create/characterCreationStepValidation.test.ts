import { describe, expect, it } from "vitest";
import { getDefaultCharacterCreationFormValues } from "@/app/(pages)/home/characters/create/schemas";
import {
  getFirstInvalidCharacterCreationStep,
  isCharacterCreationFormSubmittable,
  isCharacterCreationStepValid,
} from "@/app/(pages)/home/characters/create/characterCreationStepValidation";

describe("characterCreationStepValidation", () => {
  it("treats the backstory step as always valid", () => {
    const values = getDefaultCharacterCreationFormValues();
    expect(isCharacterCreationStepValid(0, values)).toBe(true);
  });

  it("blocks the general step when the name is missing", () => {
    const values = getDefaultCharacterCreationFormValues();
    expect(isCharacterCreationStepValid(1, values)).toBe(false);
    expect(getFirstInvalidCharacterCreationStep(values)).toBe(1);
    expect(isCharacterCreationFormSubmittable(values)).toBe(false);
  });

  it("allows the general step when the name is provided", () => {
    const values = getDefaultCharacterCreationFormValues();
    values.generalInformation.name = "Ada";
    expect(isCharacterCreationStepValid(1, values)).toBe(true);
  });

  it("blocks submission when the path is missing", () => {
    const values = getDefaultCharacterCreationFormValues();
    values.generalInformation.name = "Ada";
    expect(getFirstInvalidCharacterCreationStep(values)).toBe(5);
    expect(isCharacterCreationFormSubmittable(values)).toBe(false);
  });

  it("allows submission when required fields are present", () => {
    const values = getDefaultCharacterCreationFormValues();
    values.generalInformation.name = "Ada";
    values.path.pathId = "path-1";
    expect(isCharacterCreationFormSubmittable(values)).toBe(true);
  });
});
