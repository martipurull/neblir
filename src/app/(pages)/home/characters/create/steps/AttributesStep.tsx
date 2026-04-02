"use client";

import { RACE_ATTRIBUTE_BONUSES } from "../schemas";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import type { Race } from "@prisma/client";
import { RangeSlider } from "@/app/components/shared/RangeSlider";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";

const ATTRIBUTE_ENTRIES: {
  group: keyof CharacterCreationRequest["innateAttributes"];
  key: string;
  label: string;
}[] = [
  { group: "intelligence", key: "investigation", label: "Investigation" },
  { group: "intelligence", key: "memory", label: "Memory" },
  { group: "intelligence", key: "deduction", label: "Deduction" },
  { group: "wisdom", key: "sense", label: "Sense" },
  { group: "wisdom", key: "perception", label: "Perception" },
  { group: "wisdom", key: "insight", label: "Insight" },
  { group: "personality", key: "persuasion", label: "Persuasion" },
  { group: "personality", key: "deception", label: "Deception" },
  { group: "personality", key: "mentality", label: "Mentality" },
  { group: "strength", key: "athletics", label: "Athletics" },
  { group: "strength", key: "resilience", label: "Resilience" },
  { group: "strength", key: "bruteForce", label: "Brute Force" },
  { group: "dexterity", key: "manual", label: "Manual" },
  { group: "dexterity", key: "stealth", label: "Stealth" },
  { group: "dexterity", key: "agility", label: "Agility" },
  {
    group: "constitution",
    key: "resistanceInternal",
    label: "Resistance (internal)",
  },
  {
    group: "constitution",
    key: "resistanceExternal",
    label: "Resistance (external)",
  },
  { group: "constitution", key: "stamina", label: "Stamina" },
];

const GROUP_LABELS: Record<
  keyof CharacterCreationRequest["innateAttributes"],
  string
> = {
  intelligence: "Intelligence",
  wisdom: "Wisdom",
  personality: "Personality",
  strength: "Strength",
  dexterity: "Dexterity",
  constitution: "Constitution",
};

const TOTAL_POINTS = 36;
const BASE_POINTS = 18; // 18 attributes at 1
const RACE_BONUS_POINTS = 2;
const POINTS_TO_ALLOCATE = TOTAL_POINTS - BASE_POINTS - RACE_BONUS_POINTS; // 16

function isRaceBonus(race: Race, group: string, key: string): boolean {
  const bonuses = RACE_ATTRIBUTE_BONUSES[race];
  return bonuses.some((b) => b.group === group && b.key === key);
}

export function AttributesStep() {
  const { watch, setValue, control } =
    useFormContext<CharacterCreationRequest>();
  const race = watch("generalInformation.race") as Race;
  const attributes = watch("innateAttributes");

  // Apply race bonuses (ensure bonus attributes are at least 2 when entering this step)
  React.useLayoutEffect(() => {
    // Use explicit paths to keep react-hook-form types happy.
    switch (race) {
      case "KINIAN":
        if ((watch("innateAttributes.wisdom.perception") ?? 1) < 2) {
          setValue("innateAttributes.wisdom.perception", 2, {
            shouldDirty: false,
          });
        }
        if ((watch("innateAttributes.strength.bruteForce") ?? 1) < 2) {
          setValue("innateAttributes.strength.bruteForce", 2, {
            shouldDirty: false,
          });
        }
        break;
      case "FENNE":
        if ((watch("innateAttributes.dexterity.manual") ?? 1) < 2) {
          setValue("innateAttributes.dexterity.manual", 2, {
            shouldDirty: false,
          });
        }
        if ((watch("innateAttributes.intelligence.investigation") ?? 1) < 2) {
          setValue("innateAttributes.intelligence.investigation", 2, {
            shouldDirty: false,
          });
        }
        break;
      case "HUMAN":
        if ((watch("innateAttributes.strength.resilience") ?? 1) < 2) {
          setValue("innateAttributes.strength.resilience", 2, {
            shouldDirty: false,
          });
        }
        if ((watch("innateAttributes.wisdom.insight") ?? 1) < 2) {
          setValue("innateAttributes.wisdom.insight", 2, {
            shouldDirty: false,
          });
        }
        break;
      case "MANFENN":
        if ((watch("innateAttributes.strength.resilience") ?? 1) < 2) {
          setValue("innateAttributes.strength.resilience", 2, {
            shouldDirty: false,
          });
        }
        if ((watch("innateAttributes.dexterity.manual") ?? 1) < 2) {
          setValue("innateAttributes.dexterity.manual", 2, {
            shouldDirty: false,
          });
        }
        break;
      default:
        break;
    }
  }, [race, setValue, watch]);

  const sum = attributes
    ? Object.values(attributes).reduce(
        (acc, group) =>
          acc + (Object.values(group) as number[]).reduce((a, v) => a + v, 0),
        0
      )
    : 0;
  const spent = sum - BASE_POINTS - RACE_BONUS_POINTS;
  const remaining = POINTS_TO_ALLOCATE - spent;
  const isOverAllocated = remaining < 0;

  return (
    <div className="relative space-y-4">
      <div className="sticky top-2 z-10 flex justify-end">
        <div
          className={`rounded-md border px-3 py-2 text-sm font-semibold shadow-sm backdrop-blur bg-transparent ${
            isOverAllocated
              ? "border-neblirDanger-600 bg-neblirDanger-50/70 text-neblirDanger-700"
              : "border-black/20 bg-white/60 text-black"
          }`}
        >
          Points allocated: {spent} / {POINTS_TO_ALLOCATE}
        </div>
      </div>
      <p className="text-sm text-black/70">
        All attributes start at 1. Your race gives +1 to two attributes (shown
        below). You have <strong>{POINTS_TO_ALLOCATE}</strong> points to
        allocate (max 5 per attribute, total sum {TOTAL_POINTS}).
      </p>
      {isOverAllocated && (
        <p className="text-sm text-neblirDanger-600">
          You have allocated too many points. Reduce one or more attributes.
        </p>
      )}
      <div className="space-y-3">
        {(
          Object.keys(GROUP_LABELS) as Array<
            keyof CharacterCreationRequest["innateAttributes"]
          >
        ).map((group) => {
          const groupEntries = ATTRIBUTE_ENTRIES.filter(
            (e) => e.group === group
          );
          return (
            <section
              key={group}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2"
            >
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/70">
                {GROUP_LABELS[group]}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-black/10">
                {groupEntries.map(({ key, label }) => {
                  const min = isRaceBonus(race, group, key) ? 2 : 1;
                  const name = `innateAttributes.${group}.${key}` as const;
                  return (
                    <div key={`${group}.${key}`} className="lg:px-3">
                      <Controller
                        // FieldPath typing doesn’t like template strings here; keep runtime correct.
                        name={name as never}
                        control={control}
                        render={({ field }) => {
                          const current =
                            typeof field.value === "number" ? field.value : min;
                          // Don’t let the user increase past their remaining pool.
                          // If remaining is negative, cap at current so only decreasing is possible.
                          const effectiveRemaining = Math.max(0, remaining);
                          const maxByPool = current + effectiveRemaining;
                          // Guard: for race-bonus attributes, never let the pool cap
                          // push allowedMax below min (can otherwise visually drop the
                          // race-bonus attribute to 1).
                          const allowedMax = Math.max(
                            min,
                            Math.min(5, maxByPool)
                          );
                          const isInvalid = current > 5;
                          return (
                            <RangeSlider
                              id={`attr-${group}-${key}`}
                              label={label}
                              labelSuffix={
                                isRaceBonus(race, group, key)
                                  ? "(race +1)"
                                  : undefined
                              }
                              value={current}
                              allowedMin={min}
                              allowedMax={allowedMax}
                              visualMin={1}
                              visualMax={5}
                              step={1}
                              error={isInvalid || isOverAllocated}
                              onChange={(v) => field.onChange(v)}
                              className="mb-0"
                            />
                          );
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
