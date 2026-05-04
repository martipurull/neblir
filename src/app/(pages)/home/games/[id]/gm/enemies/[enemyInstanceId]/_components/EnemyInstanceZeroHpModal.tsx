"use client";

import Button from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import type {
  EnemyInstanceDetailResponse,
  EnemyInstancePatch,
} from "@/lib/api/enemyInstances";

type EnemyInstanceZeroHpModalProps = {
  isOpen: boolean;
  onClose: () => void;
  applyEnemyPatch: (
    build: (prev: EnemyInstanceDetailResponse) => EnemyInstancePatch
  ) => void;
};

export function EnemyInstanceZeroHpModal({
  isOpen,
  onClose,
  applyEnemyPatch,
}: EnemyInstanceZeroHpModalProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Reduced to 0 HP"
      titleId="enemy-zero-hp-status-title"
      subtitle="Choose how this instance should be marked in the encounter."
      maxWidthClass="max-w-md"
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="modalFooterSecondary"
            fullWidth={false}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="semanticWarningOutline"
            fullWidth={false}
            onClick={() => {
              onClose();
              applyEnemyPatch(() => ({
                currentHealth: 0,
                status: "DEFEATED",
              }));
            }}
          >
            Defeated
          </Button>
          <Button
            type="button"
            variant="semanticDangerOutline"
            fullWidth={false}
            onClick={() => {
              onClose();
              applyEnemyPatch(() => ({
                currentHealth: 0,
                status: "DEAD",
              }));
            }}
          >
            Dead
          </Button>
        </div>
      }
    >
      <p className="text-sm text-white/90">
        This enemy has been brought to <strong>0 HP</strong>. Mark them as{" "}
        <strong>defeated</strong> (incapacitated, surrendered, unconscious) or{" "}
        <strong>dead</strong>, depending on what happened in play.
      </p>
      <p className="mt-2 text-xs text-white/65">
        Cancel keeps their previous HP and status unchanged.
      </p>
    </ModalShell>
  );
}
