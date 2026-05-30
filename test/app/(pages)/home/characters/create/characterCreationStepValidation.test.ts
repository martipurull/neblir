import { describe, expect, it } from "vitest";
import { getDefaultCharacterCreationFormValues } from "@/app/(pages)/home/characters/create/schemas";
import {
  getFirstInvalidCharacterCreationStep,
  isCharacterCreationFormSubmittable,
  isCharacterCreationStepValid,
  isCharacterFeatureSelectionValid,
} from "@/app/(pages)/home/characters/create/characterCreationStepValidation";

function validGeneralValues() {
  const values = getDefaultCharacterCreationFormValues();
  values.generalInformation.name = "Ada";
  return values;
}

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

  it("blocks the skills step when points exceed the level-based maximum", () => {
    const values = validGeneralValues();
    values.generalInformation.level = 2;
    values.health.rolledPhysicalHealth = 11;
    values.health.rolledMentalHealth = 11;
    values.learnedSkills.generalSkills.mechanics = 5;
    values.learnedSkills.generalSkills.software = 5;
    values.learnedSkills.generalSkills.generalKnowledge = 5;
    values.learnedSkills.generalSkills.history = 5;

    expect(isCharacterCreationStepValid(4, values)).toBe(false);
    expect(getFirstInvalidCharacterCreationStep(values)).toBe(4);
  });

  it("blocks the health step when rolled HP exceeds the level-based maximum", () => {
    const values = validGeneralValues();
    values.generalInformation.level = 1;
    values.health.rolledPhysicalHealth = 25;
    values.health.rolledMentalHealth = 10;

    expect(isCharacterCreationStepValid(3, values)).toBe(false);
    expect(getFirstInvalidCharacterCreationStep(values)).toBe(3);
  });

  it("blocks the path step when feature grades exceed available slots", () => {
    const values = validGeneralValues();
    values.generalInformation.level = 2;
    values.path.pathId = "path-1";

    expect(
      isCharacterCreationStepValid(5, values, {
        initialFeatures: [
          { featureId: "feat-1", grade: 2 },
          { featureId: "feat-2", grade: 1 },
        ],
      })
    ).toBe(false);
    expect(
      isCharacterFeatureSelectionValid(2, [{ featureId: "feat-1", grade: 3 }])
    ).toBe(false);
  });
});
