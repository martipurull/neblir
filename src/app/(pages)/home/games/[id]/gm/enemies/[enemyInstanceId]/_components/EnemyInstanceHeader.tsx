"use client";

import Button from "@/app/components/shared/Button";
import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import PageTitle from "@/app/components/shared/PageTitle";
import type { EnemyInstanceDetailResponse } from "@/lib/api/enemyInstances";
import Image from "next/image";
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
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-black/15 bg-paleBlue/20">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover object-top"
            sizes="112px"
          />
        ) : imageUrl === undefined ? (
          <ImageLoadingSkeleton
            variant="avatar"
            className="h-full w-full [&_svg]:h-28 [&_svg]:w-28"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-black">
            {enemy.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
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
