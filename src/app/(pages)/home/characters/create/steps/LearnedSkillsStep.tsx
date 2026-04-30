"use client";

import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { RangeSlider } from "@/app/components/shared/RangeSlider";
import { useMemo } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

const GENERAL_SKILL_ENTRIES: {
  key: keyof CharacterCreationRequest["learnedSkills"]["generalSkills"];
  label: string;
}[] = [
  { key: "mechanics", label: "Mechanics" },
  { key: "software", label: "Software" },
  { key: "generalKnowledge", label: "General Knowledge" },
  { key: "history", label: "History" },
  { key: "driving", label: "Driving" },
  { key: "acrobatics", label: "Acrobatics" },
  { key: "aim", label: "Aim" },
  { key: "melee", label: "Melee" },
  { key: "GRID", label: "GRID" },
  { key: "research", label: "Research" },
  { key: "medicine", label: "Medicine" },
  { key: "science", label: "Science" },
  { key: "survival", label: "Survival" },
  { key: "streetwise", label: "Streetwise" },
  { key: "performance", label: "Performance" },
  { key: "manipulationNegotiation", label: "Manipulation & Negotiation" },
];

function skillPointsUsed(
  generalSkills: CharacterCreationRequest["learnedSkills"]["generalSkills"]
): number {
  return (Object.values(generalSkills) as number[]).reduce(
    (acc, val) => acc + (val === 5 ? 6 : val),
    0
  );
}

function skillCost(val: number): number {
  return val === 5 ? 6 : val;
}

export function LearnedSkillsStep() {
  const { control } = useFormContext<CharacterCreationRequest>();
  const level = useWatch({ control, name: "generalInformation.level" }) ?? 1;
  const specialSkills =
    useWatch({ control, name: "learnedSkills.specialSkills" }) ?? [];
  const { formState } = useFormContext<CharacterCreationRequest>();
  const stepError =
    (
      formState.errors.learnedSkills?.generalSkills as unknown as
        | { message?: string }
        | undefined
    )?.message ?? null;
  const filledSpecial = specialSkills.filter((s: string) => s?.trim()).length;
  const maxPoints = 13 + level + (3 - filledSpecial);
  const watchedGeneralSkills = useWatch({
    control,
    name: "learnedSkills.generalSkills",
  });
  const generalSkills = useMemo(
    () =>
      watchedGeneralSkills ??
      ({} as CharacterCreationRequest["learnedSkills"]["generalSkills"]),
    [watchedGeneralSkills]
  );
  const used = skillPointsUsed(generalSkills);
  const isOverAllocated = used > maxPoints;

  const allowedMaxForSkill = useMemo(() => {
    // Precompute allowed max slider value (0..5) for each skill based on total pool.
    const result = new Map<string, number>();
    for (const { key } of GENERAL_SKILL_ENTRIES) {
      const current = (generalSkills as Record<string, number>)[key] ?? 0;
      const baseUsed = used - skillCost(current);
      let best = 0;
      for (let candidate = 5; candidate >= 0; candidate--) {
        if (baseUsed + skillCost(candidate) <= maxPoints) {
          best = candidate;
          break;
        }
      }
      result.set(String(key), best);
    }
    return result;
  }, [generalSkills, used, maxPoints]);

  return (
    <div className="relative space-y-4">
      <div className="sticky top-2 z-10 flex justify-end">
        <div
          className={`rounded-md border px-3 py-2 text-sm font-semibold shadow-sm backdrop-blur bg-transparent ${
            isOverAllocated
              ? "border-neblirDanger-600 bg-neblirDanger-50/70 text-neblirDanger-700"
              : "border-black/20 bg-paleBlue/60 text-black"
          }`}
        >
          Skill points used: {used} / {maxPoints}
        </div>
      </div>
      <p className="text-sm text-black/70">
        All learned skills start at 0. You have <strong>{maxPoints}</strong>{" "}
        points (13 + level + 1 per empty special skill slot, max 3). Skills at
        grade 5 count as 6 points.
      </p>
      {isOverAllocated && (
        <p className="text-sm text-neblirDanger-600">
          You’ve exceeded your skill point limit. Reduce one or more skills, or
          clear a special skill you just added.
        </p>
      )}
      {stepError && (
        <p className="text-sm text-neblirDanger-600" role="alert">
          {stepError}
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {GENERAL_SKILL_ENTRIES.map(({ key, label }) => (
          <Controller
            key={key}
            name={`learnedSkills.generalSkills.${key}` as const}
            control={control}
            render={({ field }) => (
              <RangeSlider
                id={`skill-${key}`}
                label={label}
                value={typeof field.value === "number" ? field.value : 0}
                allowedMin={0}
                allowedMax={allowedMaxForSkill.get(String(key)) ?? 0}
                visualMin={0}
                visualMax={5}
                step={1}
                error={isOverAllocated}
                onChange={(v) => field.onChange(v)}
                className="mb-0"
              />
            )}
          />
        ))}
      </div>
      <div className="my-4">
        <p className="mb-2 block font-bold text-black">
          Special skills (optional, max 3)
        </p>
        <p className="mb-4 text-xs text-black/70">
          Leave blank to gain +1 general skill point each. Fill in a name (e.g.
          &quot;Reactor Core expert&quot;) to count as a special skill instead
          (this will give you +2 on specific rolls for the special skill — at
          the GM&apos;s discretion).
        </p>
        {[0, 1, 2].map((i) => (
          <Controller
            key={i}
            name={`learnedSkills.specialSkills.${i}` as const}
            control={control}
            render={({ field }) => (
              <input
                type="text"
                {...field}
                value={field.value ?? ""}
                placeholder={`Special skill ${i + 1}`}
                className={`mb-2 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover ${
                  isOverAllocated
                    ? "border-neblirDanger-600 bg-neblirDanger-50/50"
                    : "border-black/20 bg-paleBlue"
                }`}
              />
            )}
          />
        ))}
      </div>
    </div>
  );
}
