"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import React from "react";

function formatLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getSkillsSection(
  character: CharacterDetail
): CharacterSectionSlide {
  const skills = character.learnedSkills;
  const generalSkillsEntries =
    skills.generalSkills &&
    (Object.entries(skills.generalSkills) as [string, number][]);

  return {
    id: "skills",
    title: "Skills",
    children: (
      <div className="space-y-8">
        <div className="space-y-3">
          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
            <span className="h-3 w-px bg-black" aria-hidden />
            General Skills
          </span>
          {generalSkillsEntries ? (
            <ul className="divide-y divide-black rounded border border-black">
              {generalSkillsEntries.map(([skillKey, value]) => (
                <li key={skillKey}>
                  <button
                    type="button"
                    data-skill-type="general"
                    data-skill={skillKey}
                    className="flex w-full items-baseline justify-between gap-4 px-3 py-2.5 text-left transition hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
                  >
                    <span className="text-sm text-black">
                      {formatLabel(skillKey)}
                    </span>
                    <span className="text-sm font-medium tabular-nums text-black">
                      {value}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-black">No general skills.</p>
          )}
          {skills.specialSkills && skills.specialSkills.length > 0 && (
            <div className="space-y-3">
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
                <span className="h-3 w-px bg-black" aria-hidden />
                Special Skills
              </span>
              <ul className="divide-y divide-black rounded border border-black">
                {skills.specialSkills.map((name, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      data-skill-type="special"
                      data-skill-index={index}
                      data-skill-name={name}
                      className="flex w-full items-center px-3 py-2.5 text-left text-sm text-black transition hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    ),
  };
}
