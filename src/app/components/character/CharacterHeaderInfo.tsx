"use client";

import { Button } from "@/app/components/shared/Button";
import { RemoteAvatar } from "@/app/components/shared/RemoteAvatar";
import { UpArrowIcon } from "@/app/components/shared/UpArrowIcon";
import type { Status } from "@prisma/client";
import { Suspense, useState } from "react";
import type { SelectDropdownOption } from "@/app/components/shared/SelectDropdown";
import {
  CharacterNameActionsModal,
  type CharacterGameLinkForActions,
} from "./CharacterNameActionsModal";
import { DicePairIcon } from "./DicePairIcon";

export interface CharacterHeaderInfoProps {
  /** Resolved avatar URL, `undefined` while loading, or `null` when none is set. */
  avatarUrl: string | null | undefined;
  avatarKey?: string | null;
  name: string;
  level: number;
  pathsLabel: string;
  characterId: string;
  activeGameOptions: SelectDropdownOption[];
  gameLinks?: CharacterGameLinkForActions[];
  activeGameId: string | null;
  onActiveGameChange: (gameId: string) => void;
  onVisibilityUpdated?: () => void | Promise<void>;
  /** Opens the dedicated attribute/skill dice roller */
  onOpenDiceRoller?: () => void;
  /** When false, hides level-up / update actions */
  showCharacterActions?: boolean;
  status?: Status | null;
  className?: string;
}

export function CharacterHeaderInfo({
  avatarUrl,
  avatarKey,
  name,
  level,
  pathsLabel,
  characterId,
  activeGameOptions,
  gameLinks = [],
  activeGameId,
  onActiveGameChange,
  onVisibilityUpdated,
  onOpenDiceRoller,
  showCharacterActions = true,
  status,
  className,
}: CharacterHeaderInfoProps) {
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <div className={`flex items-center gap-4 pb-2 ${className ?? ""}`}>
      {onOpenDiceRoller ? (
        <Button
          type="button"
          variant="lightHeaderIconAffordance"
          fullWidth={false}
          onClick={onOpenDiceRoller}
          title="Dice roller — roll with two attributes or one attribute and a skill"
          aria-label="Open dice roller"
          className="h-11 w-11"
        >
          <DicePairIcon className="h-9 w-9" />
        </Button>
      ) : null}

      <RemoteAvatar
        imageUrl={avatarUrl}
        imageKey={avatarKey}
        alt={`${name} avatar`}
        size={48}
        className="h-12 w-12"
        status={status}
        openFullImageLabel={`Open ${name} avatar image`}
      />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="truncate text-base font-bold text-black">{name}</h1>
          <p className="text-sm text-black">
            LVL {level} · {pathsLabel}
          </p>
        </div>

        {showCharacterActions ? (
          <Button
            type="button"
            variant="lightHeaderIconAffordance"
            fullWidth={false}
            aria-label={`Character actions for ${name}`}
            aria-haspopup="dialog"
            aria-expanded={actionsOpen}
            onClick={() => setActionsOpen(true)}
            className="min-h-11 min-w-11"
          >
            <UpArrowIcon className="h-8 w-8" />
          </Button>
        ) : null}
      </div>

      {showCharacterActions ? (
        <Suspense fallback={null}>
          <CharacterNameActionsModal
            isOpen={actionsOpen}
            onClose={() => setActionsOpen(false)}
            characterId={characterId}
            characterName={name}
            gameOptions={activeGameOptions}
            gameLinks={gameLinks}
            activeGameId={activeGameId}
            onActiveGameChange={onActiveGameChange}
            onVisibilityUpdated={onVisibilityUpdated}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
