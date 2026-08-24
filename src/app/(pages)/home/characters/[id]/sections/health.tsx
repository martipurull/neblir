"use client";

import { HealthCrisisPanel } from "@/app/components/character/HealthCrisisPanel";
import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import { KeyValueRow } from "./section-shared";

export function getHealthSection(
  character: CharacterDetail,
  options?: {
    readOnly?: boolean;
    gameId?: string | null;
    rollIsPrivate?: boolean;
    mutate?: () => Promise<unknown>;
  }
): CharacterSectionSlide {
  const health = character.health;
  const readOnly = options?.readOnly ?? true;
  const entries = [
    {
      label: "Physical",
      value: `${health.currentPhysicalHealth}/${health.maxPhysicalHealth}`,
    },
    {
      label: "Mental",
      value: `${health.currentMentalHealth}/${health.maxMentalHealth}`,
    },
    {
      label: "Serious Injuries",
      value: String(health.seriousPhysicalInjuries),
    },
    { label: "Serious Trauma", value: String(health.seriousTrauma) },
  ];
  if (readOnly) {
    entries.push({
      label: "Status",
      value: String(health.status).replace(/_/g, " ").toLowerCase(),
    });
  }

  return {
    id: "health",
    title: "Health",
    children: (
      <div className="space-y-6">
        <ul className="divide-y divide-black">
          {entries.map(({ label, value }) => (
            <KeyValueRow
              key={label}
              label={label}
              value={value}
              className="py-3 first:pt-0"
            />
          ))}
        </ul>
        <HealthCrisisPanel
          character={character}
          readOnly={readOnly}
          gameId={options?.gameId ?? null}
          rollIsPrivate={options?.rollIsPrivate}
          mutate={options?.mutate ?? (async () => undefined)}
        />
      </div>
    ),
  };
}
