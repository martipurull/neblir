"use client";

import { Button } from "@/app/components/shared/Button";
import { botRollBlockedMessage } from "@/app/lib/botAttributeRoll";
import { BOT_UPGRADE_LABELS } from "@/app/lib/botTracks";
import type { BotHolding } from "@/app/lib/types/bot";
import type { BotActionRoll } from "@/app/lib/types/botAction";
import {
  BotActionRollModal,
  type BotActionRollRequest,
} from "@/app/components/character/BotActionRollModal";
import type { RollPrivacyOptions } from "@/app/lib/roll-privacy";
import { useState } from "react";

function actionSummary(action: BotActionRoll): string {
  const attribute =
    action.attribute == null
      ? ""
      : ` + ${BOT_UPGRADE_LABELS[action.attribute]}`;
  const damage =
    action.damage == null
      ? ""
      : ` · ${action.damage.pool}d${action.damage.diceType} ${action.damage.damageType}`;
  return `${action.toHitPool} to-hit dice${attribute}${damage}`;
}

function ActionList({
  title,
  actions,
  canRoll,
  onRoll,
}: {
  title: string;
  actions: BotActionRoll[];
  canRoll: boolean;
  onRoll: (action: BotActionRoll) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white/90">{title}</h3>
      {actions.length === 0 ? (
        <p className="text-sm text-white/55">None.</p>
      ) : (
        <ul className="space-y-2">
          {actions.map((action) => (
            <li key={`${title}-${action.index}`}>
              {canRoll ? (
                <Button
                  type="button"
                  variant="modalBrowseListRow"
                  disabled={!action.mayRoll}
                  aria-label={`Roll ${action.name}`}
                  onClick={() => onRoll(action)}
                >
                  <span className="flex min-w-0 flex-1 flex-col items-start">
                    <span className="text-sm text-white">{action.name}</span>
                    <span className="text-xs text-white/60">
                      {actionSummary(action)}
                    </span>
                  </span>
                </Button>
              ) : (
                <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-sm text-white">{action.name}</div>
                  <div className="text-xs text-white/60">
                    {actionSummary(action)}
                  </div>
                </div>
              )}
              {action.notes ? (
                <p className="mt-1 px-1 text-xs text-white/55">
                  {action.notes}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function BotActionsSection({
  holding,
  canRoll,
  characterId,
  gameId,
  rollPrivacy,
}: {
  holding: BotHolding;
  canRoll: boolean;
  characterId: string;
  gameId: string | null;
  rollPrivacy: RollPrivacyOptions;
}) {
  const [request, setRequest] = useState<BotActionRollRequest | null>(null);
  const blocked = botRollBlockedMessage(holding);
  const rollable = canRoll && gameId != null && gameId.length > 0;

  return (
    <section className="space-y-4">
      {blocked != null ? (
        <p className="text-sm text-neblirWarning-300">{blocked}</p>
      ) : null}
      <ActionList
        title="Bot actions"
        actions={holding.actions}
        canRoll={rollable}
        onRoll={(action) =>
          setRequest({ kind: "bot", list: "actions", action })
        }
      />
      <ActionList
        title="Bot additional actions"
        actions={holding.additionalActions}
        canRoll={rollable}
        onRoll={(action) =>
          setRequest({ kind: "bot", list: "additionalActions", action })
        }
      />
      {holding.installedItems.map((row) =>
        row.botActions.length === 0 ? null : (
          <ActionList
            key={row.itemCharacterId}
            title={`${row.item?.name ?? "Item"} actions`}
            actions={row.botActions}
            canRoll={rollable}
            onRoll={(action) =>
              setRequest({
                kind: "item",
                itemCharacterId: row.itemCharacterId,
                itemName: row.item?.name ?? "Item",
                action,
              })
            }
          />
        )
      )}
      {request != null && gameId != null && gameId.length > 0 ? (
        <BotActionRollModal
          key={`${request.kind}-${request.action.index}-${
            request.kind === "item" ? request.itemCharacterId : request.list
          }`}
          request={request}
          characterId={characterId}
          botCharacterId={holding.id}
          gameId={gameId}
          rollPrivacy={rollPrivacy}
          onClose={() => setRequest(null)}
        />
      ) : null}
    </section>
  );
}
