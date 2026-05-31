"use client";

import { PathDescriptionModal } from "@/app/components/character/PathDescriptionModal";
import { PathCard } from "@/app/components/character/PathCard";
import { SoldierFavouriteWeaponSection } from "@/app/components/character/SoldierFavouriteWeaponSection";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { Path } from "@/app/lib/types/path";
import type { KeyedMutator } from "swr";
import { useState } from "react";

export interface PathsListProps {
  paths: Path[];
  characterId: string;
  readOnly?: boolean;
  mutate?: KeyedMutator<CharacterDetail | null>;
}

export function PathsList({
  paths,
  characterId,
  readOnly = false,
  mutate,
}: PathsListProps) {
  const [descriptionForId, setDescriptionForId] = useState<string | null>(null);
  const activePath =
    descriptionForId != null
      ? paths.find((p) => p.id === descriptionForId)
      : undefined;

  return (
    <>
      <ul className="space-y-4">
        {paths.map((path) => (
          <li key={path.id}>
            <PathCard
              path={path}
              onOpenDescription={
                path.description != null && path.description !== ""
                  ? () => setDescriptionForId(path.id)
                  : undefined
              }
            >
              <SoldierFavouriteWeaponSection
                path={path}
                characterId={characterId}
                readOnly={readOnly}
                mutate={mutate}
              />
            </PathCard>
          </li>
        ))}
      </ul>
      {activePath != null && (
        <PathDescriptionModal
          path={activePath}
          onClose={() => setDescriptionForId(null)}
        />
      )}
    </>
  );
}
