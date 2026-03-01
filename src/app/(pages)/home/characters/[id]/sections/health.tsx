"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import React from "react";
import { KeyValueRow } from "./section-shared";

export function getHealthSection(
  character: CharacterDetail
): CharacterSectionSlide {
  const health = character.health;
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
    {
      label: "Status",
      value: String(health.status).replace(/_/g, " ").toLowerCase(),
    },
  ];

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
        {health.deathSaves && (
          <div className="border-t border-black pt-4">
            <span className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
              <span className="h-3 w-px bg-black" aria-hidden />
              Death Saves
            </span>
            <div className="mt-3 flex gap-6">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-black">
                  Successes
                </span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded border border-black bg-transparent text-sm"
                      aria-hidden
                    >
                      {i < health.deathSaves!.successes ? (
                        <span className="text-black" aria-label="Success">
                          ✓
                        </span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-black">
                  Failures
                </span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded border border-black bg-transparent text-sm"
                      aria-hidden
                    >
                      {i < health.deathSaves!.failures ? (
                        <span className="text-black" aria-label="Failure">
                          ✗
                        </span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    ),
  };
}
