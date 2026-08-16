"use client";

import { EnemyDetailsView } from "@/app/components/games/EnemyDetailsView";
import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { RemoteAvatar } from "@/app/components/shared/RemoteAvatar";
import { enemyTemplateToDetailsModel } from "@/app/lib/enemyDetailsView";
import type { EnemyResponse } from "@/app/lib/types/enemy";
import { getCustomEnemy } from "@/lib/api/customEnemies";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useEffect, useState } from "react";

type EnemyDetailsModalProps = {
  isOpen: boolean;
  gameId: string;
  customEnemyId: string;
  enemyName: string;
  imageUrl?: string | null;
  imageKey?: string | null;
  onClose: () => void;
};

type EnemyDetailsModalContentProps = Omit<EnemyDetailsModalProps, "isOpen">;

export function EnemyDetailsModal({
  isOpen,
  gameId,
  customEnemyId,
  ...rest
}: EnemyDetailsModalProps) {
  if (!isOpen) return null;
  return (
    <EnemyDetailsModalContent
      key={`${gameId}:${customEnemyId}`}
      gameId={gameId}
      customEnemyId={customEnemyId}
      {...rest}
    />
  );
}

function EnemyDetailsModalContent({
  gameId,
  customEnemyId,
  enemyName,
  imageUrl,
  imageKey,
  onClose,
}: EnemyDetailsModalContentProps) {
  const [enemy, setEnemy] = useState<EnemyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getCustomEnemy(gameId, customEnemyId)
      .then((row) => {
        if (!cancelled) setEnemy(row);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(getUserSafeErrorMessage(e, "Failed to load enemy"));
          setEnemy(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, customEnemyId]);

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title={enemy?.name ?? enemyName}
      titleId="game-enemy-details-title"
      maxWidthClass="max-w-3xl"
      footer={
        <div className="flex justify-end">
          <Button
            type="button"
            variant="modalFooterSecondary"
            fullWidth={false}
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-3">
        <RemoteAvatar
          imageUrl={imageUrl}
          imageKey={imageKey ?? enemy?.imageKey}
          alt=""
          size={48}
          className="h-12 w-12"
        />
        <p className="text-xs text-white/70">
          {enemy
            ? `Init ${enemy.initiativeModifier >= 0 ? "+" : ""}${enemy.initiativeModifier} · HP ${enemy.health} · Spd ${enemy.speed}`
            : "Game enemy"}
        </p>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-white/75">Loading enemy details...</p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-neblirDanger-300">{error}</p>
      ) : null}
      {enemy ? (
        <div className="mt-4">
          <EnemyDetailsView details={enemyTemplateToDetailsModel(enemy)} />
        </div>
      ) : null}
    </ModalShell>
  );
}
