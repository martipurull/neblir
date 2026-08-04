"use client";

import type { AttackType } from "@/app/components/combat/AttackRollModal";
import type { AttackModifierOption } from "@/app/lib/equipCombatUtils";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import {
  emitIsPrivateFromRollPrivacy,
  getGmRollPrivacyForEnemyInstance,
} from "@/app/lib/roll-privacy";
import type { GameDetail } from "@/app/lib/types/game";
import { useImageUrls } from "@/hooks/use-image-urls";
import {
  getEnemyInstance,
  type EnemyInstanceDetailResponse,
  type EnemyInstancePatch,
  updateEnemyInstance,
} from "@/lib/api/enemyInstances";
import {
  adjustGameInitiativeEntry,
  getGameById,
  submitGameInitiative,
} from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RollHighlightMode } from "@/app/components/shared/RollResultQuickModal";
import {
  decideEnemyHealthDelta,
  enemyHpBarTone,
  mergeEnemyInstancePatch,
  rollDice,
  rollD10,
} from "./enemyInstanceUtils";

export type DefenceModalState = { title: string; dice: number } | null;
export type AttackModalState = {
  attackType: AttackType;
  options: AttackModifierOption[];
} | null;

export type QuickResultState = {
  title: string;
  subtitle?: string;
  results: number[];
  highlightMode: RollHighlightMode;
  total?: number;
  totalLabel?: string;
} | null;

export function useEnemyInstancePage() {
  const params = useParams();
  const gameId = typeof params.id === "string" ? params.id : "";
  const enemyInstanceId =
    typeof params.enemyInstanceId === "string" ? params.enemyInstanceId : "";

  const [enemy, setEnemy] = useState<EnemyInstanceDetailResponse | null>(null);
  const [gameDetail, setGameDetail] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [defenceModal, setDefenceModal] = useState<DefenceModalState>(null);
  const [attackModal, setAttackModal] = useState<AttackModalState>(null);
  const [quickResult, setQuickResult] = useState<QuickResultState>(null);
  const [diceRollerOpen, setDiceRollerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [zeroHpPromptOpen, setZeroHpPromptOpen] = useState(false);
  const [initiativeBusy, setInitiativeBusy] = useState(false);
  const [initiativeAdjustBusy, setInitiativeAdjustBusy] = useState(false);
  const [initiativeListOpen, setInitiativeListOpen] = useState(false);

  /** Latest enemy for rapid optimistic clicks — never stash persist flags inside setState. */
  const enemyRef = useRef<EnemyInstanceDetailResponse | null>(null);
  enemyRef.current = enemy;

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!gameId || !enemyInstanceId) return;
      const silent = options?.silent === true;
      if (!silent) {
        setLoading(true);
        setLoadError(null);
      }
      try {
        const [data, game] = await Promise.all([
          getEnemyInstance(gameId, enemyInstanceId),
          getGameById(gameId).catch(() => null),
        ]);
        enemyRef.current = data;
        setEnemy(data);
        setGameDetail(game);
        setBanner(null);
      } catch (e) {
        if (silent) {
          setBanner(
            getUserSafeErrorMessage(e, "Failed to refresh enemy instance")
          );
        } else {
          setLoadError(
            getUserSafeErrorMessage(e, "Failed to load enemy instance")
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [enemyInstanceId, gameId]
  );

  const persistEnemyPatchRequest = useCallback(
    async (instanceId: string, patch: EnemyInstancePatch) => {
      try {
        await updateEnemyInstance(gameId, instanceId, patch);
      } catch (e) {
        const msg = getUserSafeErrorMessage(
          e,
          "Failed to update enemy instance"
        );
        await load({ silent: true });
        setBanner(msg);
      }
    },
    [gameId, load]
  );

  const applyEnemyPatch = useCallback(
    (build: (prev: EnemyInstanceDetailResponse) => EnemyInstancePatch) => {
      const cur = enemyRef.current;
      if (!cur) return;
      const patch = build(cur);
      const next = mergeEnemyInstancePatch(cur, patch);
      enemyRef.current = next;
      setEnemy(next);
      setBanner(null);
      void persistEnemyPatchRequest(cur.id, patch);
    },
    [persistEnemyPatchRequest]
  );

  const applyHealthDelta = useCallback(
    (delta: number) => {
      const cur = enemyRef.current;
      if (!cur) return;
      const decision = decideEnemyHealthDelta(cur.currentHealth, delta);
      if (decision.kind === "prompt") {
        setZeroHpPromptOpen(true);
        return;
      }
      const next = mergeEnemyInstancePatch(cur, decision.patch);
      enemyRef.current = next;
      setEnemy(next);
      setBanner(null);
      void persistEnemyPatchRequest(cur.id, decision.patch);
    },
    [persistEnemyPatchRequest]
  );

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

  const defenceRows = useMemo(() => {
    if (!enemy) return [];
    return (
      [
        { key: "melee", title: "Melee defence", dice: enemy.defenceMelee },
        { key: "range", title: "Range defence", dice: enemy.defenceRange },
        { key: "grid", title: "Grid defence", dice: enemy.defenceGrid },
      ] as const
    ).filter((r) => r.dice > 0);
  }, [enemy]);

  const attackRows = useMemo(() => {
    if (!enemy) return [];
    return (
      [
        {
          key: "melee" as const,
          label: "Melee attack",
          mod: enemy.attackMelee,
        },
        {
          key: "range" as const,
          label: "Range attack",
          mod: enemy.attackRange,
        },
        {
          key: "throw" as const,
          label: "Throw attack",
          mod: enemy.attackThrow,
        },
        { key: "grid" as const, label: "GRID attack", mod: enemy.attackGrid },
      ] as const
    ).filter((r) => r.mod > 0);
  }, [enemy]);

  const spendReaction = useCallback(() => {
    applyEnemyPatch((cur) => ({
      reactionsRemaining: Math.max(0, cur.reactionsRemaining - 1),
    }));
  }, [applyEnemyPatch]);

  const rollPrivacy = useMemo(
    () => getGmRollPrivacyForEnemyInstance(enemy?.isPublic),
    [enemy?.isPublic]
  );
  const [isPrivateRoll, setIsPrivateRoll] = useState(
    rollPrivacy.defaultPrivateRoll
  );
  useEffect(() => {
    setIsPrivateRoll(rollPrivacy.defaultPrivateRoll);
  }, [enemy?.id, rollPrivacy.defaultPrivateRoll]);
  const emitIsPrivate = emitIsPrivateFromRollPrivacy(
    rollPrivacy,
    isPrivateRoll
  );

  const handleInitiativeRoll = useCallback(async () => {
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
        isPrivate: emitIsPrivate,
        rollType: "INITIATIVE",
        diceExpression: "1d10",
        results: [rolledValue],
        total: rolledValue + enemy.initiativeModifier,
        metadata: {
          initiativeModifier: enemy.initiativeModifier,
          source: "enemyInstancePage",
          enemyInstanceId: enemy.id,
          enemyName: enemy.name,
          combatantType: "ENEMY",
          combatantId: enemy.id,
          combatantName: enemy.name,
        },
      });
      await load({ silent: true });
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
  }, [enemy, gameId, hasInitiativeEntry, load, emitIsPrivate]);

  const handleAdjustInitiativeInGame = useCallback(
    async (delta: number) => {
      if (!enemy || !gameId || !initiativeEntry) return;
      setInitiativeAdjustBusy(true);
      setBanner(null);
      try {
        await adjustGameInitiativeEntry(gameId, `ENEMY:${enemy.id}`, delta);
        await load({ silent: true });
      } catch (e) {
        setBanner(
          getUserSafeErrorMessage(
            e,
            "Could not adjust initiative for this game."
          )
        );
      } finally {
        setInitiativeAdjustBusy(false);
      }
    },
    [enemy, gameId, initiativeEntry, load]
  );

  const runActionToHit = useCallback(
    (actionName: string, dice: number) => {
      if (!enemy || dice <= 0) return;
      const rolls = rollD10(dice);
      const sum = rolls.reduce((a, b) => a + b, 0);
      void emitRollEvent(gameId, {
        isPrivate: emitIsPrivate,
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
    },
    [enemy, gameId, emitIsPrivate]
  );

  const runActionDamage = useCallback(
    (
      actionName: string,
      n: number,
      sides: number,
      damageType?: string | null
    ) => {
      if (!enemy || n <= 0 || sides <= 0) return;
      const rolls = rollDice(n, sides);
      const sum = rolls.reduce((a, b) => a + b, 0);
      void emitRollEvent(gameId, {
        isPrivate: emitIsPrivate,
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
    },
    [enemy, gameId, emitIsPrivate]
  );

  return {
    gameId,
    enemyInstanceId,
    enemy,
    gameDetail,
    loading,
    loadError,
    banner,
    load,
    imageUrls,
    hpStyles,
    enemyRollCtx,
    hasInitiativeEntry,
    initiativeEntry,
    defenceRows,
    attackRows,
    applyEnemyPatch,
    applyHealthDelta,
    spendReaction,
    handleInitiativeRoll,
    initiativeBusy,
    handleAdjustInitiativeInGame,
    initiativeAdjustBusy,
    defenceModal,
    setDefenceModal,
    attackModal,
    setAttackModal,
    quickResult,
    setQuickResult,
    diceRollerOpen,
    setDiceRollerOpen,
    editOpen,
    setEditOpen,
    zeroHpPromptOpen,
    setZeroHpPromptOpen,
    initiativeListOpen,
    setInitiativeListOpen,
    runActionToHit,
    runActionDamage,
    rollPrivacy,
    isPrivateRoll,
    setIsPrivateRoll,
  };
}
