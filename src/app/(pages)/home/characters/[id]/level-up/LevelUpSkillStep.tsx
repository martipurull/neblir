import type { UseFormReturn } from "react-hook-form";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import type { LevelUpGeneralSkill } from "@/lib/api/character";
import { GENERAL_SKILL_OPTIONS } from "./constants";
import type { LevelUpFormValues } from "./types";

type Props = {
  form: UseFormReturn<LevelUpFormValues>;
  targetLevel: number;
  onOpenQuickCheck: () => void;
};

export default function LevelUpSkillStep({
  form,
  targetLevel,
  onOpenQuickCheck,
}: Props) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onOpenQuickCheck}
        className="rounded border border-black/30 px-3 py-1.5 text-sm text-black transition-colors hover:border-black/50"
      >
        Check current skill points
      </button>
      <p className="text-sm text-black/70">
        Choose one learned skill to improve by +1 at level {targetLevel}.
      </p>
      <SelectDropdown
        id="skill-improvement"
        label="Skill to improve"
        placeholder="Select one skill"
        value={form.watch("skillImprovement")}
        options={GENERAL_SKILL_OPTIONS}
        onChange={(v) =>
          form.setValue("skillImprovement", v as LevelUpGeneralSkill, {
            shouldDirty: true,
          })
        }
      />
      {form.formState.errors.skillImprovement?.message && (
        <p className="text-sm text-neblirDanger-600" role="alert">
          {form.formState.errors.skillImprovement.message}
        </p>
      )}
    </div>
  );
}
