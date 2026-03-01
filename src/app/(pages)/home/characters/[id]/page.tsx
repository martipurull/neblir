"use client";

import {
  CharacterSectionCarousel,
  type CharacterSectionSlide,
} from "@/app/components/character/CharacterSectionCarousel";
import { CharacterSummaryHeader } from "@/app/components/character/CharacterSummaryHeader";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import { useCharacter } from "@/hooks/use-character";
import { useImageUrls } from "@/hooks/use-image-urls";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";

export default function CharacterDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { character, loading, error, refetch } = useCharacter(id);
  const [usedReactions, setUsedReactions] = useState(0);

  const imageEntries = useMemo(
    () =>
      character
        ? [
            {
              id: character.id,
              imageKey: character.generalInformation.avatarKey,
            },
            ...(character.wallet ?? []).map((entry) => ({
              id: entry.currencyName,
              imageKey: `currency-${entry.currencyName.toLowerCase()}.png`,
            })),
          ]
        : [],
    [character]
  );
  const imageUrls = useImageUrls(imageEntries);
  const avatarUrl =
    character != null ? (imageUrls[character.id] ?? null) : null;

  if (id == null) {
    return (
      <PageSection>
        <p className="text-sm text-red-600">Invalid character.</p>
      </PageSection>
    );
  }

  if (loading) {
    return (
      <PageSection>
        <LoadingState text="Loading character..." />
      </PageSection>
    );
  }

  if (error || !character) {
    return (
      <PageSection>
        <ErrorState
          message={error ?? "Character not found"}
          onRetry={refetch}
          retryLabel="Retry"
        />
      </PageSection>
    );
  }

  const generalInfo = character.generalInformation;
  const health = character.health;
  const combat = character.combatInformation;
  const attrs = character.innateAttributes;
  const skills = character.learnedSkills;

  const healthEntries = [
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

  const generalInfoEntries = [
    {
      label: "Name",
      value: [generalInfo.name, generalInfo.surname].filter(Boolean).join(" "),
    },
    { label: "Age", value: String(generalInfo.age) },
    { label: "Profession", value: generalInfo.profession },
    { label: "Race", value: generalInfo.race },
    { label: "Religion", value: generalInfo.religion },
    { label: "Birthplace", value: generalInfo.birthplace },
    { label: "Height", value: `${generalInfo.height} cm` },
    { label: "Weight", value: `${generalInfo.weight} kg` },
  ];

  const sections: CharacterSectionSlide[] = [
    {
      id: "general",
      title: "General Information",
      children: (
        <ul className="divide-y divide-black">
          {generalInfoEntries.map(({ label, value }) => (
            <li
              key={label}
              className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0"
            >
              <span className="flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
                <span className="h-3 w-px bg-black" aria-hidden />
                {label}
              </span>
              <span className="min-w-0 truncate text-right text-sm text-black">
                {value}
              </span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "health",
      title: "Health",
      children: (
        <div className="space-y-6">
          <ul className="divide-y divide-black">
            {healthEntries.map(({ label, value }) => (
              <li
                key={label}
                className="flex items-baseline justify-between gap-4 py-3 first:pt-0"
              >
                <span className="flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
                  <span className="h-3 w-px bg-black" aria-hidden />
                  {label}
                </span>
                <span className="min-w-0 truncate text-right text-sm text-black">
                  {value}
                </span>
              </li>
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
    },
    {
      id: "attributes",
      title: "Attributes",
      children: (() => {
        const formatLabel = (key: string) =>
          key
            .replace(/([A-Z])/g, " $1")
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase());
        const mental: (keyof typeof attrs)[] = [
          "intelligence",
          "wisdom",
          "personality",
        ];
        const physical: (keyof typeof attrs)[] = [
          "strength",
          "dexterity",
          "constitution",
        ];
        const renderAttributeGroup = (
          groupLabel: string,
          attributeKeys: (keyof typeof attrs)[]
        ) => (
          <div key={groupLabel} className="space-y-4">
            <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
              <span className="h-3 w-px bg-black" aria-hidden />
              {groupLabel}
            </span>
            <div className="space-y-4">
              {attributeKeys.map((attrKey) => {
                const group = attrs[attrKey];
                if (typeof group !== "object" || group === null) return null;
                const entries = Object.entries(
                  group as Record<string, number>
                ) as [string, number][];
                return (
                  <div key={attrKey} className="space-y-1.5">
                    <span className="text-xs font-medium text-black">
                      {formatLabel(attrKey)}
                    </span>
                    <ul className="divide-y divide-black rounded border border-black">
                      {entries.map(([attrKey, value]) => (
                        <li key={attrKey}>
                          <button
                            type="button"
                            data-attribute-group={attrKey}
                            data-skill={attrKey}
                            className="flex w-full items-baseline justify-between gap-4 px-3 py-2.5 text-left transition hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
                          >
                            <span className="text-sm text-black">
                              {formatLabel(attrKey)}
                            </span>
                            <span className="text-sm font-medium tabular-nums text-black">
                              {value}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        );
        return (
          <div className="space-y-8">
            {renderAttributeGroup("Mental Attributes", mental)}
            {renderAttributeGroup("Physical Attributes", physical)}
          </div>
        );
      })(),
    },
    {
      id: "skills",
      title: "Skills",
      children: (() => {
        const formatLabel = (key: string) =>
          key
            .replace(/([A-Z])/g, " $1")
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase());
        const generalSkillsEntries =
          skills.generalSkills &&
          (Object.entries(skills.generalSkills) as [string, number][]);
        return (
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
        );
      })(),
    },
    {
      id: "combat",
      title: "Combat",
      titleSupplement: (
        <button
          type="button"
          onClick={() => setUsedReactions(0)}
          className="rounded border border-inventoryWarning-200 bg-transparent px-2 py-1 text-xs font-medium text-inventoryWarning-400 transition hover:bg-inventoryWarning-200/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
        >
          Clear Reactions
        </button>
      ),
      children: (
        <ul className="divide-y divide-black">
          {[
            {
              label: "Initiative",
              value: `${combat.initiativeMod >= 0 ? "+" : ""}${combat.initiativeMod}`,
            },
            { label: "Speed", value: `${combat.speed} m` },
            {
              label: "Reactions per round",
              value: String(combat.reactionsPerRound),
            },
            {
              label: "Armour modifier",
              value: `${combat.armourMod >= 0 ? "+" : ""}${combat.armourMod}`,
            },
            {
              label: "Armour HP",
              value: `${combat.armourCurrentHP}/${combat.armourMaxHP}`,
            },
          ].map(({ label, value }) => (
            <li
              key={label}
              className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0"
            >
              <span className="flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
                <span className="h-3 w-px bg-black" aria-hidden />
                {label}
              </span>
              <span className="min-w-0 truncate text-right text-sm text-black">
                {value}
              </span>
            </li>
          ))}
        </ul>
      ),
    },
  ];

  if (character.paths && character.paths.length > 0) {
    sections.push({
      id: "paths",
      title: "Paths",
      children: (
        <ul className="space-y-1">
          {character.paths.map((path) => (
            <li key={path.id}>
              <span className="font-medium">{String(path.name)}</span>
              {path.description && (
                <p className="mt-0.5 text-black">{path.description}</p>
              )}
            </li>
          ))}
        </ul>
      ),
    });
  }

  const inventory = character.inventory ?? [];
  const totalInventoryWeight = inventory.reduce(
    (sum, entry) => sum + (entry.item?.weight ?? 0) * (entry.quantity ?? 1),
    0
  );
  const maxCarryWeight = character.combatInformation?.maxCarryWeight;
  const inventoryWeightSupplement =
    maxCarryWeight != null ? (
      (() => {
        const ratio = totalInventoryWeight / maxCarryWeight;
        const className =
          ratio > 1
            ? "rounded border border-inventoryOver-200 bg-transparent px-2 py-0.5 text-sm tabular-nums text-inventoryOver-400"
            : ratio >= 0.5
              ? "rounded border border-inventoryWarning-200 bg-transparent px-2 py-0.5 text-sm tabular-nums text-inventoryWarning-400"
              : "rounded border border-inventorySafe-200 bg-transparent px-2 py-0.5 text-sm tabular-nums text-inventorySafe-400";
        return (
          <span className={className}>
            {totalInventoryWeight} / {maxCarryWeight} kg
          </span>
        );
      })()
    ) : totalInventoryWeight > 0 ? (
      <span className="rounded border border-black bg-transparent px-2 py-0.5 text-sm tabular-nums text-black">
        {totalInventoryWeight} kg
      </span>
    ) : undefined;
  sections.push({
    id: "inventory",
    title: "Inventory",
    titleSupplement: inventoryWeightSupplement,
    children: (
      <div className="space-y-0">
        {inventory.length === 0 ? (
          <p className="py-4 text-center text-sm text-black">No items</p>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_2.5rem_3rem] gap-3 border-b border-black pb-2 text-xs font-medium uppercase tracking-widest text-black">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-px shrink-0 bg-black" aria-hidden />
                Item
              </span>
              <span className="text-right">Qty</span>
              <span className="text-right">Weight</span>
            </div>
            <ul className="divide-y divide-black">
              {inventory.map((entry) => {
                const name =
                  entry.customName ?? entry.item?.name ?? "Unknown item";
                const description = entry.item?.description ?? null;
                const weight = entry.item?.weight;
                return (
                  <li
                    key={entry.id}
                    className="grid grid-cols-[1fr_2.5rem_3rem] gap-3 py-2.5 items-start"
                  >
                    <div className="min-w-0 overflow-x-auto">
                      <div className="flex items-baseline gap-1">
                        <span className="shrink-0 text-sm text-black whitespace-nowrap">
                          {name}
                        </span>
                        {entry.isEquipped && (
                          <span className="shrink-0 text-xs text-black">
                            (equipped)
                          </span>
                        )}
                      </div>
                      {description && (
                        <div
                          className="mt-0.5 max-h-[3.75rem] overflow-y-auto text-xs leading-relaxed text-black"
                          style={{ scrollbarWidth: "thin" }}
                        >
                          {description}
                        </div>
                      )}
                    </div>
                    <span className="text-right text-sm tabular-nums text-black">
                      {entry.quantity ?? 1}
                    </span>
                    <span className="text-right text-sm tabular-nums text-black">
                      {weight != null ? `${weight}kg` : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    ),
  });

  if (character.wallet && character.wallet.length > 0) {
    sections.push({
      id: "wallet",
      title: "Wallet",
      children: (
        <ul className="divide-y divide-black border border-black rounded">
          {character.wallet.map((entry) => {
            const currencyImageUrl = imageUrls[entry.currencyName] ?? null;
            return (
              <li
                key={entry.currencyName}
                className="flex items-center gap-3 px-3 py-2.5 first:pt-3 last:pb-3"
              >
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/20">
                  {currencyImageUrl ? (
                    <Image
                      src={currencyImageUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-black">
                      {entry.currencyName.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium tabular-nums text-black">
                  {entry.quantity}
                </span>
                <span className="text-sm text-black min-w-0 truncate">
                  {entry.currencyName}
                </span>
                <div className="ml-auto flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    className="rounded border border-inventorySafe-200 bg-transparent px-2 py-0.5 text-xs font-medium text-inventorySafe-400"
                  >
                    ADD
                  </button>
                  <button
                    type="button"
                    className="rounded border border-inventoryOver-200 bg-transparent px-2 py-0.5 text-xs font-medium text-inventoryOver-400"
                  >
                    SUBTRACT
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ),
    });
  }

  if (character.notes && character.notes.length > 0) {
    sections.push({
      id: "notes",
      title: "Notes",
      children: (
        <ul className="list-disc space-y-1 pl-4">
          {character.notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      ),
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CharacterSummaryHeader
        character={character}
        avatarUrl={avatarUrl}
        usedReactions={usedReactions}
        onUseReaction={() =>
          setUsedReactions((prev) =>
            Math.min(prev + 1, combat.reactionsPerRound)
          )
        }
        className="shrink-0"
      />
      <CharacterSectionCarousel
        sections={sections}
        className="min-h-0 flex-1"
      />
    </div>
  );
}
