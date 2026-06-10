"use client";

import { DicePairIcon } from "@/app/components/character/DicePairIcon";
import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import type { RollPrivacyOptions } from "@/app/lib/roll-privacy";
import type { EnemyInstanceDetailResponse } from "@/lib/api/enemyInstances";
import type { GameDetail } from "@/app/lib/types/game";

type EnemyInstanceToolbarProps = {
  enemy: EnemyInstanceDetailResponse;
  gameDetail: GameDetail | null;
  hasInitiativeEntry: boolean;
  initiativeBusy: boolean;
  onOpenDiceRoller: () => void;
  onResetReactions: () => void;
  onRollInitiative: () => void;
  rollPrivacy: RollPrivacyOptions;
  isPrivateRoll: boolean;
  onPrivateRollChange: (checked: boolean) => void;
};

export function EnemyInstanceToolbar({
  enemy,
  gameDetail,
  hasInitiativeEntry,
  initiativeBusy,
  onOpenDiceRoller,
  onResetReactions,
  onRollInitiative,
  rollPrivacy,
  isPrivateRoll,
  onPrivateRollChange,
}: EnemyInstanceToolbarProps) {
  return (
    <div className="space-y-3">
      {rollPrivacy.allowPrivateRoll ? (
        <div className="rounded border border-black/15 bg-paleBlue/60 p-3">
          <Checkbox
            checked={isPrivateRoll}
            onChange={onPrivateRollChange}
            label="Private roll (hide enemy and roll details on Discord)"
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondaryOutlineXs"
          fullWidth={false}
          onClick={onOpenDiceRoller}
          title="Dice roller — damage and free rolls (Discord)"
          aria-label="Open dice roller"
          className="inline-flex items-center gap-2"
        >
          <DicePairIcon className="h-7 w-7 shrink-0 text-current" />
          <span>Dice roller</span>
        </Button>
        <Button
          type="button"
          variant="semanticWarningOutline"
          fullWidth={false}
          onClick={onResetReactions}
        >
          Reset reactions
        </Button>
        <Button
          type="button"
          variant="semanticWarningOutline"
          fullWidth={false}
          disabled={initiativeBusy || hasInitiativeEntry || !gameDetail}
          title={
            hasInitiativeEntry
              ? "Initiative already recorded for this instance in this game."
              : !gameDetail
                ? "Could not load game data."
                : undefined
          }
          onClick={() => void onRollInitiative()}
        >
          {initiativeBusy
            ? "Rolling…"
            : hasInitiativeEntry
              ? "Initiative rolled"
              : `Roll initiative (${enemy.initiativeModifier >= 0 ? "+" : ""}${enemy.initiativeModifier})`}
        </Button>
      </div>
    </div>
  );
}
