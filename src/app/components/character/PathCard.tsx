// eslint-disable-next-line no-unused-expressions
"use client";

import type { Path } from "@/app/lib/types/path";
import React from "react";

export interface PathCardProps {
  path: Path;
  /** Pass when the path has a description; opens the description modal */
  onOpenDescription?: () => void;
}

export function PathCard({ path, onOpenDescription }: PathCardProps) {
  return (
    <div className="rounded-lg border-2 border-black bg-transparent p-3 shadow-sm">
      <div>
        {onOpenDescription ? (
          <button
            type="button"
            onClick={onOpenDescription}
            className="text-left text-base font-semibold text-black underline decoration-black/35 underline-offset-2 transition-colors hover:decoration-black"
          >
            {String(path.name)}
          </button>
        ) : (
          <span className="text-base font-semibold text-black">
            {String(path.name)}
          </span>
        )}
      </div>
      <div className="mt-3 border-t border-black/15 pt-2">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-black/55">
          Base feature
        </p>
        <p className="mt-1.5 text-sm leading-snug text-black">
          {path.baseFeature}
        </p>
      </div>
    </div>
  );
}
