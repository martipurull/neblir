"use client";

import { Button } from "@/app/components/shared/Button";
import { PageTitle } from "@/app/components/shared/PageTitle";
import { RemoteAvatar } from "@/app/components/shared/RemoteAvatar";
import type { EnemyInstanceDetailResponse } from "@/lib/api/enemyInstances";
import { enemyStatusBadgeClass, enemyStatusLabel } from "../enemyInstanceUtils";

type EnemyInstanceHeaderProps = {
  enemy: EnemyInstanceDetailResponse;
  imageUrl: string | undefined | null;
  onEdit: () => void;
};

export function EnemyInstanceHeader({
  enemy,
  imageUrl,
  onEdit,
}: EnemyInstanceHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
      <RemoteAvatar
        imageUrl={imageUrl}
        imageKey={enemy.imageKey}
        alt=""
        size={112}
        className="h-28 w-28 border border-black/15"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <PageTitle>{enemy.name}</PageTitle>
          <Button
            type="button"
            variant="secondaryOutlineXs"
            fullWidth={false}
            onClick={onEdit}
            className="shrink-0"
          >
            Edit instance
          </Button>
        </div>
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-black/75">
          <span className="tabular-nums">
            Init {enemy.initiativeModifier >= 0 ? "+" : ""}
            {enemy.initiativeModifier} · Spd {enemy.speed}
          </span>
          <span className={enemyStatusBadgeClass(enemy.status)} role="status">
            {enemyStatusLabel(enemy.status)}
          </span>
        </p>
      </div>
    </div>
  );
}
