"use client";

import Button from "@/app/components/shared/Button";
import type { Path } from "@/app/lib/types/path";
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
          <Button
            type="button"
            variant="lightPathTitleLink"
            fullWidth={false}
            onClick={onOpenDescription}
          >
            {String(path.name)}
          </Button>
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
