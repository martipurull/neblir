"use client";

import {
  AttackRollModal,
  type AttackType,
} from "@/app/components/character/AttackRollModal";
import { DefenceRollModal } from "@/app/components/character/DefenceRollModal";
import { InitiativeOrderModal } from "@/app/components/character/InitiativeOrderModal";
import { EditEnemyInstanceModal } from "@/app/components/games/EditEnemyInstanceModal";
import { EnemyInstanceDiceRollerModal } from "@/app/components/games/EnemyInstanceDiceRollerModal";
import {
  RollResultQuickModal,
  type RollHighlightMode,
} from "@/app/components/games/RollResultQuickModal";
import { DicePairIcon } from "@/app/components/character/DicePairIcon";
import Button from "@/app/components/shared/Button";
import ErrorState from "@/app/components/shared/ErrorState";
import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import type { AttackModifierOption } from "@/app/lib/equipCombatUtils";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import type { GameDetail } from "@/app/lib/types/game";
import { useImageUrls } from "@/hooks/use-image-urls";
import {
  getEnemyInstance,
  type EnemyInstanceDetailResponse,
  updateEnemyInstance,
} from "@/lib/api/enemyInstances";
import {
  adjustGameInitiativeEntry,
  getGameById,
  submitGameInitiative,
} from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function rollD10(times: number): number[] {
  return Array.from(
    { length: times },
    () => 1 + Math.floor(Math.random() * 10)
  );
}

function rollDice(times: number, dieSize: number): number[] {
  return Array.from(
    { length: times },
    () => 1 + Math.floor(Math.random() * Math.max(1, dieSize))
  );
}

function enemyAttackOption(mod: number, label: string): AttackModifierOption {
  return {
    mod,
    weaponName: label,
    damageText: "",
    numberOfDice: 0,
    diceType: 4,
  };
}

function enemyHpBarTone(
  current: number,
  max: number
): {
  bar: string;
  track: string;
  text: string;
} {
  if (max <= 0) {
    return {
      bar: "bg-neblirSafe-600",
      track: "bg-black/10",
      text: "text-neblirSafe-600",
    };
  }
  const ratio = current / max;
  if (ratio > 0.75) {
    return {
      bar: "bg-neblirSafe-600",
      track: "bg-neblirSafe-200/60",
      text: "text-neblirSafe-600",
    };
  }
  if (ratio >= 0.3) {
    return {
      bar: "bg-neblirWarning-400",
      track: "bg-neblirWarning-200/50",
      text: "text-neblirWarning-600",
    };
  }
  return {
    bar: "bg-neblirDanger-600",
    track: "bg-neblirDanger-200/50",
    text: "text-neblirDanger-600",
  };
}

type DefenceModalState = { title: string; dice: number } | null;
type AttackModalState = {
  attackType: AttackType;
  options: AttackModifierOption[];
} | null;

type QuickResultState = {
  title: string;
  subtitle?: string;
  results: number[];
  highlightMode: RollHighlightMode;
  total?: number;
  totalLabel?: string;
} | null;

export default function EnemyInstancePage() {
  const params = useParams();
  const gameId = typeof params.id === "string" ? params.id : "";
  const enemyInstanceId =
    typeof params.enemyInstanceId === "string" ? params.enemyInstanceId : "";
  const [enemy, setEnemy] = useState<EnemyInstanceDetailResponse | null>(null);
  const [gameDetail, setGameDetail] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [defenceModal, setDefenceModal] = useState<DefenceModalState>(null);
  const [attackModal, setAttackModal] = useState<AttackModalState>(null);
  const [quickResult, setQuickResult] = useState<QuickResultState>(null);
  const [diceRollerOpen, setDiceRollerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [initiativeBusy, setInitiativeBusy] = useState(false);
  const [initiativeAdjustBusy, setInitiativeAdjustBusy] = useState(false);
  const [initiativeListOpen, setInitiativeListOpen] = useState(false);

  const load = useCallback(async () => {
    if (!gameId || !enemyInstanceId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [data, game] = await Promise.all([
        getEnemyInstance(gameId, enemyInstanceId),
        getGameById(gameId).catch(() => null),
      ]);
      setEnemy(data);
      setGameDetail(game);
      setBanner(null);
    } catch (e) {
      setLoadError(getUserSafeErrorMessage(e, "Failed to load enemy instance"));
    } finally {
      setLoading(false);
    }
  }, [enemyInstanceId, gameId]);

  useEffect(() => {
    void load();
  }, [load]);

  const imageUrls = useImageUrls(
    enemy ? [{ id: enemy.id, imageKey: enemy.imageKey ?? null }] : []
  );

  const hpStyles = useMemo(
    () => (enemy ? enemyHpBarTone(enemy.currentHealth, enemy.maxHealth) : null),
    [enemy]
  );

  const enemyRollCtx = useMemo(
    () => (enemy ? { instanceId: enemy.id, name: enemy.name } : undefined),
    [enemy]
  );

  const hasInitiativeEntry = useMemo(() => {
    if (!gameDetail?.initiativeOrder || !enemy) return false;
    return gameDetail.initiativeOrder.some(
      (e) => e.combatantType === "ENEMY" && e.combatantId === enemy.id
    );
  }, [gameDetail, enemy]);

  const initiativeEntry = useMemo(() => {
    if (!gameDetail?.initiativeOrder || !enemy) return null;
    return (
      gameDetail.initiativeOrder.find(
        (e) => e.combatantType === "ENEMY" && e.combatantId === enemy.id
      ) ?? null
    );
  }, [gameDetail, enemy]);

  const patch = async (data: Parameters<typeof updateEnemyInstance>[2]) => {
    if (!enemy) return;
    setBusy(true);
    setBanner(null);
    try {
      await updateEnemyInstance(gameId, enemy.id, data);
      await load();
    } catch (e) {
      setBanner(getUserSafeErrorMessage(e, "Failed to update enemy instance"));
    } finally {
      setBusy(false);
    }
  };

  const spendReaction = async () => {
    if (!enemy) return;
    await patch({
      reactionsRemaining: Math.max(0, enemy.reactionsRemaining - 1),
    });
  };

  const handleInitiativeRoll = async () => {
    if (!enemy || !gameId) return;
    if (hasInitiativeEntry) return;
    setInitiativeBusy(true);
    setBanner(null);
    try {
      const rolledValue = 1 + Math.floor(Math.random() * 10);
      await submitGameInitiative(gameId, {
        combatantType: "ENEMY",
        combatantId: enemy.id,
        combatantName: enemy.name,
        rolledValue,
        initiativeModifier: enemy.initiativeModifier,
      });
      await emitRollEvent(gameId, {
        rollType: "INITIATIVE",
        diceExpression: "1d10",
        results: [rolledValue],
        total: rolledValue + enemy.initiativeModifier,
        metadata: {
          initiativeModifier: enemy.initiativeModifier,
          source: "enemyInstancePage",
          combatantType: "ENEMY",
          combatantId: enemy.id,
          combatantName: enemy.name,
        },
      });
      await load();
      setQuickResult({
        title: "Initiative",
        subtitle: `${enemy.name} · mod ${enemy.initiativeModifier >= 0 ? "+" : ""}${enemy.initiativeModifier}`,
        results: [rolledValue],
        highlightMode: "d10",
        total: rolledValue + enemy.initiativeModifier,
        totalLabel: "Total (with mod)",
      });
    } catch (e) {
      setBanner(getUserSafeErrorMessage(e, "Could not submit initiative."));
    } finally {
      setInitiativeBusy(false);
    }
  };

  const handleAdjustInitiativeInGame = async (delta: number) => {
    if (!enemy || !gameId || !initiativeEntry) return;
    setInitiativeAdjustBusy(true);
    setBanner(null);
    try {
      await adjustGameInitiativeEntry(gameId, `ENEMY:${enemy.id}`, delta);
      await load();
    } catch (e) {
      setBanner(
        getUserSafeErrorMessage(e, "Could not adjust initiative for this game.")
      );
    } finally {
      setInitiativeAdjustBusy(false);
    }
  };

  const runActionToHit = (actionName: string, dice: number) => {
    if (!enemy || dice <= 0) return;
    const rolls = rollD10(dice);
    const sum = rolls.reduce((a, b) => a + b, 0);
    void emitRollEvent(gameId, {
      rollType: "ATTACK",
      diceExpression: `${dice}d10`,
      results: rolls,
      metadata: {
        source: "enemyInstance",
        enemyInstanceId: enemy.id,
        enemyName: enemy.name,
        actionName,
      },
    });
    setQuickResult({
      title: `${actionName} — To hit`,
      results: rolls,
      highlightMode: "d10",
      total: sum,
      totalLabel: "Total",
    });
  };

  const runActionDamage = (
    actionName: string,
    n: number,
    sides: number,
    damageType?: string | null
  ) => {
    if (!enemy || n <= 0 || sides <= 0) return;
    const rolls = rollDice(n, sides);
    const sum = rolls.reduce((a, b) => a + b, 0);
    void emitRollEvent(gameId, {
      rollType: "ATTACK_DAMAGE",
      diceExpression: `${n}d${sides}`,
      results: rolls,
      total: sum,
      metadata: {
        source: "enemyInstance",
        enemyInstanceId: enemy.id,
        enemyName: enemy.name,
        actionName,
        damageType: damageType ?? null,
      },
    });
    setQuickResult({
      title: `${actionName} — Damage`,
      subtitle: `${n}d${sides}`,
      results: rolls,
      highlightMode: "plain",
      total: sum,
      totalLabel: "Total",
    });
  };

  if (loading) {
    return (
      <PageSection>
        <LoadingState text="Loading enemy instance..." />
      </PageSection>
    );
  }
  if (!enemy) {
    return (
      <PageSection>
        <ErrorState
          message={loadError ?? "Enemy instance not found"}
          onRetry={() => void load()}
          retryLabel="Retry"
        />
      </PageSection>
    );
  }

  const canDamage = enemy.currentHealth > 0 && !busy;
  const hpPct =
    enemy.maxHealth > 0
      ? Math.round((100 * enemy.currentHealth) / enemy.maxHealth)
      : 0;

  const defenceRows: { key: string; title: string; dice: number }[] = [
    { key: "melee", title: "Melee defence", dice: enemy.defenceMelee },
    { key: "range", title: "Range defence", dice: enemy.defenceRange },
    { key: "grid", title: "Grid defence", dice: enemy.defenceGrid },
  ].filter((r) => r.dice > 0);

  const attackRows = [
    { key: "melee" as const, label: "Melee attack", mod: enemy.attackMelee },
    { key: "range" as const, label: "Range attack", mod: enemy.attackRange },
    { key: "throw" as const, label: "Throw attack", mod: enemy.attackThrow },
    { key: "grid" as const, label: "GRID attack", mod: enemy.attackGrid },
  ].filter((r) => r.mod > 0);

  return (
    <PageSection>
      <div className="flex flex-col gap-5">
        {banner ? (
          <p className="rounded border border-neblirDanger-200 bg-neblirDanger-200/35 px-3 py-2 text-sm text-neblirDanger-600">
            {banner}
          </p>
        ) : null}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-black/15 bg-paleBlue/20">
            {imageUrls[enemy.id] ? (
              <Image
                src={imageUrls[enemy.id] as string}
                alt=""
                fill
                className="object-cover object-top"
                sizes="112px"
              />
            ) : imageUrls[enemy.id] === undefined ? (
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
                disabled={busy}
                onClick={() => setEditOpen(true)}
                className="shrink-0"
              >
                Edit instance
              </Button>
            </div>
            <p className="mt-1 text-sm tabular-nums text-black/75">
              Init {enemy.initiativeModifier >= 0 ? "+" : ""}
              {enemy.initiativeModifier} · Spd {enemy.speed} · {enemy.status}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondaryOutlineXs"
            fullWidth={false}
            disabled={busy}
            onClick={() => setDiceRollerOpen(true)}
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
            disabled={busy}
            onClick={() =>
              void patch({
                reactionsRemaining: enemy.reactionsPerRound,
              })
            }
          >
            Reset reactions
          </Button>
          <Button
            type="button"
            variant="semanticWarningOutline"
            fullWidth={false}
            disabled={
              initiativeBusy || hasInitiativeEntry || !gameDetail || busy
            }
            title={
              hasInitiativeEntry
                ? "Initiative already recorded for this instance in this game."
                : !gameDetail
                  ? "Could not load game data."
                  : undefined
            }
            onClick={() => void handleInitiativeRoll()}
          >
            {initiativeBusy
              ? "Rolling…"
              : hasInitiativeEntry
                ? "Initiative rolled"
                : `Roll initiative (${enemy.initiativeModifier >= 0 ? "+" : ""}${enemy.initiativeModifier})`}
          </Button>
        </div>

        {gameDetail ? (
          <div className="relative rounded border border-black/20 p-4 text-black">
            <div className="absolute right-3 top-3 z-10 flex items-start gap-2">
              <Button
                type="button"
                variant="secondaryOutlineXs"
                fullWidth={false}
                disabled={busy}
                onClick={() => setInitiativeListOpen(true)}
                className="shrink-0"
              >
                Initiative list
              </Button>
              {initiativeEntry ? (
                <div
                  className="flex w-fit shrink-0 flex-col items-end rounded-md border border-black/30 bg-paleBlue/85 px-2 py-1 shadow-sm"
                  role="status"
                  aria-label={`Total initiative ${initiativeEntry.totalInitiative}`}
                >
                  <p className="text-[9px] font-semibold uppercase leading-none tracking-wide text-black/50">
                    Total
                  </p>
                  <p className="mt-0.5 text-xl font-bold leading-none tabular-nums text-black sm:text-2xl">
                    {initiativeEntry.totalInitiative}
                  </p>
                </div>
              ) : null}
            </div>

            <div
              className={
                initiativeEntry
                  ? "pr-[12.5rem] sm:pr-[14rem]"
                  : "pr-[9.5rem] sm:pr-[10.5rem]"
              }
            >
              <h2 className="text-sm font-semibold text-black">
                Initiative in this game
              </h2>
              {initiativeEntry ? (
                <>
                  <p className="mt-2 text-xs text-black/65">
                    d10 roll + stored modifier (same as GM initiative list). Use
                    −1 / +1 to nudge the modifier for this encounter&apos;s
                    order.
                  </p>
                  <p className="mt-2 text-sm tabular-nums text-black">
                    Rolled{" "}
                    <span className="font-semibold">
                      {initiativeEntry.rolledValue}
                    </span>
                    {" · "}
                    Modifier{" "}
                    <span className="font-semibold">
                      {initiativeEntry.initiativeModifier >= 0 ? "+" : ""}
                      {initiativeEntry.initiativeModifier}
                    </span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondaryOutlineXs"
                      fullWidth={false}
                      disabled={initiativeAdjustBusy || busy}
                      onClick={() => void handleAdjustInitiativeInGame(-1)}
                    >
                      −1 total
                    </Button>
                    <Button
                      type="button"
                      variant="secondaryOutlineXs"
                      fullWidth={false}
                      disabled={initiativeAdjustBusy || busy}
                      onClick={() => void handleAdjustInitiativeInGame(1)}
                    >
                      +1 total
                    </Button>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-xs text-black/65">
                  No initiative submitted for this instance in the current game
                  yet. Use &quot;Roll initiative&quot; above when you&apos;re
                  ready.
                </p>
              )}
            </div>
          </div>
        ) : null}

        <div className="rounded border border-black/20 p-4 text-black">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p
                className={`text-sm font-semibold tabular-nums ${hpStyles?.text}`}
              >
                HP {enemy.currentHealth}/{enemy.maxHealth}
                <span className="ml-2 text-black/60">({hpPct}%)</span>
              </p>
              <div
                className={`mt-2 h-2.5 w-full max-w-md overflow-hidden rounded-full ${hpStyles?.track}`}
                role="progressbar"
                aria-valuenow={enemy.currentHealth}
                aria-valuemin={0}
                aria-valuemax={enemy.maxHealth}
              >
                <div
                  className={`h-full rounded-full transition-all ${hpStyles?.bar}`}
                  style={{
                    width: `${enemy.maxHealth > 0 ? Math.min(100, hpPct) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-black/60">
              HP
            </span>
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              disabled={!canDamage || busy}
              aria-label="Subtract 5 HP"
              onClick={() =>
                void patch({
                  currentHealth: Math.max(0, enemy.currentHealth - 5),
                  status:
                    enemy.currentHealth - 5 <= 0 ? "DEFEATED" : enemy.status,
                })
              }
            >
              −5
            </Button>
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              disabled={!canDamage || busy}
              aria-label="Subtract 1 HP"
              onClick={() =>
                void patch({
                  currentHealth: Math.max(0, enemy.currentHealth - 1),
                  status:
                    enemy.currentHealth - 1 <= 0 ? "DEFEATED" : enemy.status,
                })
              }
            >
              −1
            </Button>
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              disabled={busy}
              aria-label="Add 1 HP"
              onClick={() =>
                void patch({
                  currentHealth: Math.min(
                    enemy.maxHealth,
                    enemy.currentHealth + 1
                  ),
                  status: "ACTIVE",
                })
              }
            >
              +1
            </Button>
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              disabled={busy}
              aria-label="Add 5 HP"
              onClick={() =>
                void patch({
                  currentHealth: Math.min(
                    enemy.maxHealth,
                    enemy.currentHealth + 5
                  ),
                  status: "ACTIVE",
                })
              }
            >
              +5
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-black/10 pt-4 sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-black/60">
                Reactions
              </span>
              <p className="tabular-nums">
                <span className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
                  {enemy.reactionsRemaining}
                </span>
                <span className="text-base font-semibold text-black/45 sm:text-lg">
                  {" "}
                  / {enemy.reactionsPerRound}
                </span>
                <span className="ml-2 text-sm font-medium text-black/55">
                  left this round
                </span>
              </p>
            </div>
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              disabled={busy || enemy.reactionsRemaining <= 0}
              aria-label="Spend one reaction"
              onClick={() => void spendReaction()}
            >
              −1
            </Button>
          </div>
        </div>

        {defenceRows.length > 0 ? (
          <section className="rounded border border-black/20 p-4">
            <h2 className="text-sm font-semibold text-black">Defence rolls</h2>
            <p className="mt-1 text-xs text-black/65">
              Uses defence dice as d10 pool. Rolling spends one reaction when
              enabled below.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {defenceRows.map((r) => (
                <Button
                  key={r.key}
                  type="button"
                  variant="secondaryOutlineXs"
                  fullWidth={false}
                  onClick={() =>
                    setDefenceModal({ title: r.title, dice: r.dice })
                  }
                >
                  {r.title} ({r.dice}d10)
                </Button>
              ))}
            </div>
          </section>
        ) : null}

        {attackRows.length > 0 ? (
          <section className="rounded border border-black/20 p-4">
            <h2 className="text-sm font-semibold text-black">Attack rolls</h2>
            <p className="mt-1 text-xs text-black/65">
              Opens the same attack roller as characters (extra dice, damage on
              high hits when applicable).
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {attackRows.map((r) => (
                <Button
                  key={r.key}
                  type="button"
                  variant="secondaryOutlineXs"
                  fullWidth={false}
                  onClick={() =>
                    setAttackModal({
                      attackType: r.key,
                      options: [enemyAttackOption(r.mod, r.label)],
                    })
                  }
                >
                  {r.label} ({r.mod >= 0 ? "+" : ""}
                  {r.mod}d10)
                </Button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded border border-black/20 p-4">
          <h2 className="text-sm font-semibold text-black">Actions</h2>
          {enemy.actions.length === 0 ? (
            <p className="mt-2 text-sm text-black/70">No actions.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {enemy.actions.map((a, idx) => (
                <li
                  key={`${a.name}-${idx}`}
                  className="rounded border border-black/10 p-3"
                >
                  <p className="font-medium text-black">{a.name}</p>
                  {a.description ? (
                    <div
                      className="character-note-html mt-1 text-sm text-black/85"
                      dangerouslySetInnerHTML={{ __html: a.description }}
                    />
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {a.numberOfDiceToHit ? (
                      <Button
                        type="button"
                        variant="secondaryOutlineXs"
                        fullWidth={false}
                        onClick={() =>
                          runActionToHit(a.name, a.numberOfDiceToHit ?? 1)
                        }
                      >
                        Roll to hit ({a.numberOfDiceToHit}d10)
                      </Button>
                    ) : null}
                    {a.numberOfDamageDice && a.damageDiceType ? (
                      <Button
                        type="button"
                        variant="secondaryOutlineXs"
                        fullWidth={false}
                        onClick={() =>
                          runActionDamage(
                            a.name,
                            a.numberOfDamageDice ?? 1,
                            a.damageDiceType ?? 6,
                            a.damageType
                          )
                        }
                      >
                        Roll damage ({a.numberOfDamageDice}d{a.damageDiceType})
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border border-black/20 p-4">
          <h2 className="text-sm font-semibold text-black">
            Additional actions
          </h2>
          {enemy.additionalActions.length === 0 ? (
            <p className="mt-2 text-sm text-black/70">No additional actions.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {enemy.additionalActions.map((a, idx) => (
                <li
                  key={`${a.name}-${idx}`}
                  className="rounded border border-black/10 p-3"
                >
                  <p className="font-medium text-black">{a.name}</p>
                  {a.description ? (
                    <div
                      className="character-note-html mt-1 text-sm text-black/85"
                      dangerouslySetInnerHTML={{ __html: a.description }}
                    />
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {a.numberOfDiceToHit ? (
                      <Button
                        type="button"
                        variant="secondaryOutlineXs"
                        fullWidth={false}
                        onClick={() =>
                          runActionToHit(a.name, a.numberOfDiceToHit ?? 1)
                        }
                      >
                        Roll to hit ({a.numberOfDiceToHit}d10)
                      </Button>
                    ) : null}
                    {a.numberOfDamageDice && a.damageDiceType ? (
                      <Button
                        type="button"
                        variant="secondaryOutlineXs"
                        fullWidth={false}
                        onClick={() =>
                          runActionDamage(
                            a.name,
                            a.numberOfDamageDice ?? 1,
                            a.damageDiceType ?? 6,
                            a.damageType
                          )
                        }
                      >
                        Roll damage ({a.numberOfDamageDice}d{a.damageDiceType})
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <DefenceRollModal
        isOpen={defenceModal != null}
        onClose={() => setDefenceModal(null)}
        defenceDice={defenceModal?.dice ?? 0}
        title={defenceModal?.title ?? ""}
        reactionDisabled={enemy.reactionsRemaining <= 0}
        onRollReaction={spendReaction}
        gameId={gameId}
        enemyInstanceRoll={enemyRollCtx}
      />

      <AttackRollModal
        isOpen={attackModal != null}
        onClose={() => setAttackModal(null)}
        attackType={attackModal?.attackType ?? "melee"}
        options={attackModal?.options ?? []}
        gameId={gameId}
        enemyInstanceRoll={enemyRollCtx}
      />

      <RollResultQuickModal
        isOpen={quickResult != null}
        onClose={() => setQuickResult(null)}
        title={quickResult?.title ?? ""}
        subtitle={quickResult?.subtitle}
        results={quickResult?.results ?? []}
        highlightMode={quickResult?.highlightMode ?? "d10"}
        total={quickResult?.total}
        totalLabel={quickResult?.totalLabel}
      />

      <EnemyInstanceDiceRollerModal
        isOpen={diceRollerOpen}
        onClose={() => setDiceRollerOpen(false)}
        gameId={gameId}
        enemyInstanceId={enemy.id}
        enemyName={enemy.name}
      />

      <EditEnemyInstanceModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        gameId={gameId}
        enemy={enemy}
        onSaved={load}
      />

      {gameDetail ? (
        <InitiativeOrderModal
          isOpen={initiativeListOpen}
          onClose={() => setInitiativeListOpen(false)}
          gameDetails={[gameDetail]}
          initialGameId={gameId}
        />
      ) : null}
    </PageSection>
  );
}
