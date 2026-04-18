"use client";

import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import { Chevron } from "@/app/components/shared/Chevron";
import Image from "next/image";
import React, { useState } from "react";
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
    <div className={`flex items-center gap-5 pb-2 ${className ?? ""}`}>
      {onOpenDiceRoller ? (
        <button
          type="button"
          onClick={onOpenDiceRoller}
          title="Dice roller — roll with two attributes or one attribute and a skill"
          aria-label="Open dice roller"
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-black transition-opacity hover:opacity-70 active:opacity-55 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          <DicePairIcon className="h-9 w-9" />
        </button>
      ) : null}

      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-paleBlue/20">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${name} avatar`}
            width={48}
            height={48}
            className="h-12 w-12 object-cover object-top"
          />
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

        <button
          type="button"
          aria-label={`Character actions for ${name}`}
          aria-haspopup="dialog"
          aria-expanded={actionsOpen}
          onClick={() => setActionsOpen(true)}
          className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-black transition-opacity hover:opacity-70 active:opacity-55 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          <Chevron
            direction="right"
            strokeWidth={2.75}
            className="h-7 w-7 shrink-0"
          />
        </button>
      </div>

      <CharacterNameActionsModal
        isOpen={actionsOpen}
        onClose={() => setActionsOpen(false)}
        characterId={characterId}
      />
    </div>
  );
}
