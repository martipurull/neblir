"use client";

import Button from "@/app/components/shared/Button";
import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import { UpArrowIcon } from "@/app/components/shared/UpArrowIcon";
import Image from "next/image";
import { useState } from "react";
import { CharacterNameActionsModal } from "./CharacterNameActionsModal";
import { DicePairIcon } from "./DicePairIcon";

export interface CharacterHeaderInfoProps {
  avatarUrl: string | null;
  name: string;
  level: number;
  pathsLabel: string;
  characterId: string;
  /** Opens the dedicated attribute/skill dice roller */
  onOpenDiceRoller?: () => void;
  className?: string;
}

export function CharacterHeaderInfo({
  avatarUrl,
  name,
  level,
  pathsLabel,
  characterId,
  onOpenDiceRoller,
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

      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-paleBlue/20">
        {avatarUrl ? (
          <a
            href={avatarUrl}
            target="_blank"
            rel="noreferrer"
            className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
            aria-label={`Open ${name} avatar image`}
            title="Open full avatar image"
          >
            <Image
              src={avatarUrl}
              alt={`${name} avatar`}
              width={48}
              height={48}
              className="h-12 w-12 object-cover object-top"
            />
          </a>
        ) : (
          <ImageLoadingSkeleton
            variant="avatar"
            className="h-full w-full [&_svg]:h-12 [&_svg]:w-12"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="truncate text-base font-bold text-black">{name}</h1>
          <p className="text-sm text-black">
            LVL {level} · {pathsLabel}
          </p>
        </div>

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
      </div>

      <CharacterNameActionsModal
        isOpen={actionsOpen}
        onClose={() => setActionsOpen(false)}
        characterId={characterId}
      />
    </div>
  );
}
