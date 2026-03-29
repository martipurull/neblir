"use client";

import { PathDescriptionModal } from "@/app/components/character/PathDescriptionModal";
import { PathCard } from "@/app/components/character/PathCard";
import type { Path } from "@/app/lib/types/path";
import React, { useState } from "react";

export interface PathsListProps {
  paths: Path[];
}

export function PathsList({ paths }: PathsListProps) {
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
            />
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
