"use client";

import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import Image from "next/image";
import React, { useState } from "react";
import { CharacterNameActionsModal } from "./CharacterNameActionsModal";

export interface CharacterHeaderInfoProps {
  avatarUrl: string | null;
  name: string;
  level: number;
  pathsLabel: string;
  characterId: string;
  className?: string;
}

export function CharacterHeaderInfo({
  avatarUrl,
  name,
  level,
  pathsLabel,
  characterId,
  className,
}: CharacterHeaderInfoProps) {
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <div className={`flex items-center gap-3 pb-2 ${className ?? ""}`}>
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/20">
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
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <h1 className="text-base font-bold text-black">
          <button
            type="button"
            onClick={() => setActionsOpen(true)}
            className="max-w-full cursor-pointer rounded px-0.5 text-center text-base font-bold text-black transition-opacity hover:opacity-80 sm:text-left"
          >
            {name}
          </button>
        </h1>
        <p className="text-sm text-black">
          LVL {level} · {pathsLabel}
        </p>
      </div>

      <CharacterNameActionsModal
        isOpen={actionsOpen}
        onClose={() => setActionsOpen(false)}
        characterId={characterId}
      />
    </div>
  );
}
