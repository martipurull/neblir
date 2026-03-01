"use client";

import Image from "next/image";
import React from "react";

export interface CharacterHeaderInfoProps {
  avatarUrl: string | null;
  name: string;
  level: number;
  pathsLabel: string;
  /** Fallback initials when no avatar (e.g. "JD") */
  initials: string;
  className?: string;
}

export function CharacterHeaderInfo({
  avatarUrl,
  name,
  level,
  pathsLabel,
  initials,
  className,
}: CharacterHeaderInfoProps) {
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
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-black">
            {initials}
          </div>
        )}
      </div>
      <div className="text-center sm:text-left">
        <h1 className="text-base font-bold text-black">{name}</h1>
        <p className="text-sm text-black">
          LVL {level} · {pathsLabel}
        </p>
      </div>
    </div>
  );
}
