"use client";

import { Button } from "@/app/components/shared/Button";
import {
  BOT_COMBAT_LABELS,
  BOT_COMBAT_VALUES,
  botAttackChoices,
  botDefencePool,
  isBotAttack,
  type BotAttackChoice,
  type BotCombatValue,
} from "@/app/lib/botCombat";
import type { BotHolding } from "@/app/lib/types/bot";
import type { ItemCharacter } from "@/app/lib/types/character";

export function botCombatOfferItems(
  holding: BotHolding,
  inventory: ItemCharacter[]
): Parameters<typeof botAttackChoices>[1] {
  const byId = new Map(inventory.map((row) => [row.id, row]));
  return holding.carriedItems.map((placed) => {
    const row = byId.get(placed.itemCharacterId);
    return {
      itemCharacterId: placed.itemCharacterId,
      customName: placed.customName ?? row?.customName,
      status: row?.status,
      currentUses: row?.currentUses,
      botEquipSlots: placed.botEquipSlots,
      item: row?.item
        ? {
            name: row.item.name,
            attackRoll: row.item.attackRoll,
            attackMeleeBonus: row.item.attackMeleeBonus,
            attackRangeBonus: row.item.attackRangeBonus,
            maxUses: row.item.maxUses,
            damage: row.item.damage,
          }
        : placed.item
          ? { name: placed.item.name }
          : null,
    };
  });
}

export function BotCombatSection({
  holding,
  inventory,
  canRoll,
  onRoll,
}: {
  holding: BotHolding;
  inventory: ItemCharacter[];
  canRoll: boolean;
  onRoll: (combat: BotCombatValue) => void;
}) {
  const offers = botCombatOfferItems(holding, inventory);
  const reactionsShut = holding.reactionsRemaining <= 0;
  const mayAttack = canRoll && holding.mayRoll;
  return (
    <section className="space-y-3">
      <div>
        <div className="font-medium text-white">Attacks and defences</div>
        <p className="text-xs text-white/65">
          Reactions {holding.reactionsRemaining}/
          {holding.combat.numberOfReactions}
        </p>
        {reactionsShut && holding.mayRoll ? (
          <p className="mt-1 text-xs text-neblirDanger-300">
            No Reactions remaining.
          </p>
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {BOT_COMBAT_VALUES.map((combat) => {
          const defence = !isBotAttack(combat);
          const enabled = defence ? mayAttack && !reactionsShut : mayAttack;
          const pool = defence
            ? botDefencePool(holding.combat, holding.attributes, combat)
            : null;
          const summary =
            pool == null
              ? String(holding.combat[combat])
              : `${holding.combat[combat]} · ${pool} dice`;
          return enabled ? (
            <Button
              key={combat}
              type="button"
              variant="modalBrowseListRow"
              aria-label={`Roll ${BOT_COMBAT_LABELS[combat]}`}
              onClick={() => onRoll(combat)}
            >
              <span className="flex min-w-0 flex-1 flex-col items-start">
                <span className="text-[11px] uppercase tracking-wider text-white/60">
                  {BOT_COMBAT_LABELS[combat]}
                </span>
                <span className="text-sm text-white">{summary}</span>
              </span>
            </Button>
          ) : (
            <div
              key={combat}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2"
            >
              <div className="text-[11px] uppercase tracking-wider text-white/60">
                {BOT_COMBAT_LABELS[combat]}
              </div>
              <div className="text-sm text-white">{summary}</div>
            </div>
          );
        })}
      </div>
      {mayAttack ? (
        <p className="text-xs text-white/55">
          {offerLine("attackMelee", botAttackChoices("attackMelee", offers))}
          {" · "}
          {offerLine("attackRange", botAttackChoices("attackRange", offers))}
        </p>
      ) : null}
    </section>
  );
}

function offerLine(
  attack: "attackMelee" | "attackRange",
  choices: BotAttackChoice[]
): string {
  const weapons = choices.filter((choice) => choice.itemCharacterId);
  const open = attack === "attackMelee" ? "Unarmed" : "Improvised weapon";
  if (weapons.length === 0) return `${BOT_COMBAT_LABELS[attack]}: ${open}`;
  return `${BOT_COMBAT_LABELS[attack]}: ${weapons.map((choice) => choice.name).join(", ")}, ${open}`;
}
