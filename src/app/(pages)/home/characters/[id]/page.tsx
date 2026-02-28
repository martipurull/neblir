"use client";

import { CharacterSectionCarousel } from "@/app/components/character/CharacterSectionCarousel";
import { CharacterSummaryHeader } from "@/app/components/character/CharacterSummaryHeader";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import { useCharacter } from "@/hooks/use-character";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useParams } from "next/navigation";
import React, { useMemo } from "react";

export default function CharacterDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { character, loading, error, refetch } = useCharacter(id);

  const imageEntries = useMemo(
    () =>
      character
        ? [
            {
              id: character.id,
              imageKey: character.generalInformation.avatarKey,
            },
          ]
        : [],
    [character]
  );
  const avatarUrls = useImageUrls(imageEntries);
  const avatarUrl =
    character != null ? (avatarUrls[character.id] ?? null) : null;

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

  const gen = character.generalInformation;
  const health = character.health;
  const combat = character.combatInformation;
  const attrs = character.innateAttributes;
  const skills = character.learnedSkills;

  const sections = [
    {
      id: "general",
      title: "General information",
      children: (
        <ul className="space-y-1">
          <li>
            <span className="text-gray-500">Name:</span> {gen.name}{" "}
            {gen.surname}
          </li>
          <li>
            <span className="text-gray-500">Age:</span> {gen.age}
          </li>
          <li>
            <span className="text-gray-500">Profession:</span> {gen.profession}
          </li>
          <li>
            <span className="text-gray-500">Race:</span> {gen.race}
          </li>
          <li>
            <span className="text-gray-500">Religion:</span> {gen.religion}
          </li>
          <li>
            <span className="text-gray-500">Birthplace:</span> {gen.birthplace}
          </li>
          <li>
            <span className="text-gray-500">Height / weight:</span> {gen.height}{" "}
            / {gen.weight}
          </li>
        </ul>
      ),
    },
    {
      id: "health",
      title: "Health",
      children: (
        <ul className="space-y-1">
          <li>
            <span className="text-gray-500">Physical:</span>{" "}
            {health.currentPhysicalHealth}/{health.maxPhysicalHealth}
            {health.seriousPhysicalInjuries > 0 && (
              <> · {health.seriousPhysicalInjuries} serious injuries</>
            )}
          </li>
          <li>
            <span className="text-gray-500">Mental:</span>{" "}
            {health.currentMentalHealth}/{health.maxMentalHealth}
            {health.seriousTrauma > 0 && (
              <> · {health.seriousTrauma} serious trauma</>
            )}
          </li>
          <li>
            <span className="text-gray-500">Status:</span> {health.status}
          </li>
          {health.deathSaves && (
            <li>
              <span className="text-gray-500">Death saves:</span>{" "}
              {health.deathSaves.successes} successes /{" "}
              {health.deathSaves.failures} failures
            </li>
          )}
        </ul>
      ),
    },
    {
      id: "attributes",
      title: "Innate attributes",
      children: (
        <ul className="space-y-2">
          {Object.entries(attrs).map(([groupKey, group]) => (
            <li key={groupKey}>
              <span className="capitalize font-medium text-gray-700">
                {groupKey.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <ul className="mt-0.5 space-y-0.5 pl-2">
                {typeof group === "object" &&
                  group !== null &&
                  Object.entries(group as Record<string, number>).map(
                    ([k, v]) => (
                      <li key={k} className="text-gray-600">
                        {k.replace(/([A-Z])/g, " $1").trim()}: {v}
                      </li>
                    )
                  )}
              </ul>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "skills",
      title: "Learned skills",
      children: (
        <div className="space-y-2">
          <div>
            <span className="text-gray-500 font-medium">General:</span>
            <ul className="mt-1 space-y-0.5">
              {skills.generalSkills &&
                Object.entries(skills.generalSkills)
                  .filter(([, v]) => v != null && Number(v) > 0)
                  .map(([k, v]) => (
                    <li key={k}>
                      {k.replace(/([A-Z])/g, " $1").trim()}: {String(v)}
                    </li>
                  ))}
            </ul>
          </div>
          {skills.specialSkills && skills.specialSkills.length > 0 && (
            <div>
              <span className="text-gray-500 font-medium">Special:</span>
              <ul className="mt-1 list-disc pl-4">
                {skills.specialSkills.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "combat",
      title: "Combat details",
      children: (
        <ul className="space-y-1">
          <li>
            <span className="text-gray-500">Initiative:</span>{" "}
            {combat.initiativeMod >= 0 ? "+" : ""}
            {combat.initiativeMod}
          </li>
          <li>
            <span className="text-gray-500">Speed:</span> {combat.speed}
          </li>
          <li>
            <span className="text-gray-500">Reactions/round:</span>{" "}
            {combat.reactionsPerRound}
          </li>
          <li>
            <span className="text-gray-500">Armour:</span>{" "}
            {combat.armourMod >= 0 ? "+" : ""}
            {combat.armourMod}
            {combat.armourMaxHP > 0 && (
              <>
                {" "}
                ({combat.armourCurrentHP}/{combat.armourMaxHP} HP)
              </>
            )}
          </li>
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
                <p className="mt-0.5 text-gray-600">{path.description}</p>
              )}
            </li>
          ))}
        </ul>
      ),
    });
  }

  const inventory = character.inventory ?? [];
  sections.push({
    id: "inventory",
    title: "Inventory",
    children: (
      <ul className="space-y-2">
        {inventory.length === 0 ? (
          <li className="text-gray-500">No items</li>
        ) : (
          inventory.map((entry) => (
            <li key={entry.id}>
              <span className="font-medium">
                {entry.customName ?? entry.item?.name ?? "Unknown item"}
              </span>
              {entry.quantity > 1 && (
                <span className="text-gray-500"> × {entry.quantity}</span>
              )}
              {entry.isEquipped && (
                <span className="ml-1 text-xs text-gray-500">(equipped)</span>
              )}
              {entry.item?.description && (
                <p className="mt-0.5 text-sm text-gray-600 line-clamp-2">
                  {entry.item.description}
                </p>
              )}
            </li>
          ))
        )}
      </ul>
    ),
  });

  if (character.wallet && character.wallet.length > 0) {
    sections.push({
      id: "wallet",
      title: "Wallet",
      children: (
        <ul className="space-y-1">
          {character.wallet.map((entry) => (
            <li key={entry.currencyName}>
              <span className="text-gray-500">{entry.currencyName}:</span>{" "}
              {entry.quantity}
            </li>
          ))}
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
    <div className="flex min-h-0 flex-col">
      <CharacterSummaryHeader character={character} avatarUrl={avatarUrl} />
      <CharacterSectionCarousel sections={sections} />
    </div>
  );
}
