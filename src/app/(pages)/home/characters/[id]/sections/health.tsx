"use client";

import { CharacterStatusField } from "@/app/components/character/CharacterStatusField";
import { HealthCrisisPanel } from "@/app/components/character/HealthCrisisPanel";
import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import { KeyValueRow } from "./section-shared";

function emptyTrack() {
  return { successes: 0, failures: 0 };
}

export function getHealthSection(
  character: CharacterDetail,
  options?: {
    readOnly?: boolean;
    /** Owner can still change Status when the sheet is otherwise locked (e.g. deceased). */
    statusEditable?: boolean;
    gameId?: string | null;
    rollIsPrivate?: boolean;
    mutate?: () => Promise<unknown>;
    healthWritePending?: boolean;
    settledCrisisHealth?: {
      currentPhysicalHealth: number;
      currentMentalHealth: number;
      deathSaves: { successes: number; failures: number } | null | undefined;
      madnessSaves: { successes: number; failures: number } | null | undefined;
    } | null;
  }
): CharacterSectionSlide {
  const health = character.health;
  const readOnly = options?.readOnly ?? true;
  const statusEditable = options?.statusEditable ?? !readOnly;
  const mutate = options?.mutate ?? (async () => undefined);
  const visibilityHealth =
    options?.healthWritePending && options.settledCrisisHealth != null
      ? options.settledCrisisHealth
      : health;
  const death = visibilityHealth.deathSaves ?? emptyTrack();
  const madness = visibilityHealth.madnessSaves ?? emptyTrack();
  const inCrisis =
    visibilityHealth.currentPhysicalHealth === 0 ||
    visibilityHealth.currentMentalHealth === 0 ||
    death.successes > 0 ||
    death.failures > 0 ||
    madness.successes > 0 ||
    madness.failures > 0;

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

  return {
    id: "health",
    title: "Health",
    panelClassName: inCrisis
      ? "border-neblirWarning-400 bg-paleBlue shadow-[inset_0_0_0_1px_rgba(234,179,8,0.35)]"
      : undefined,
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
          <CharacterStatusField
            characterId={character.id}
            status={health.status}
            editable={statusEditable}
            disabled={options?.healthWritePending}
            mutate={mutate}
          />
        </ul>
        <HealthCrisisPanel
          key={character.id}
          character={character}
          readOnly={readOnly}
          gameId={options?.gameId ?? null}
          rollIsPrivate={options?.rollIsPrivate}
          mutate={mutate}
          healthWritePending={options?.healthWritePending}
          settledCrisisHealth={options?.settledCrisisHealth}
        />
      </div>
    ),
  };
}
