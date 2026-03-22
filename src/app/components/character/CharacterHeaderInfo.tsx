// eslint-disable-next-line no-unused-expressions
"use client";

import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import Image from "next/image";
import React from "react";

export interface CharacterHeaderInfoProps {
  avatarUrl: string | null;
  name: string;
  level: number;
  pathsLabel: string;
  className?: string;
}

export function CharacterHeaderInfo({
  avatarUrl,
  name,
  level,
  pathsLabel,
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
          <ImageLoadingSkeleton
            variant="avatar"
            className="h-full w-full [&_svg]:h-12 [&_svg]:w-12"
          />
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
