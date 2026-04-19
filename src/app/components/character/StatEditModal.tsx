"use client";

import Button from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import React, { useState } from "react";

export type StatEditType = "physical" | "mental" | "armour";

export interface StatEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: StatEditType;
  /** Current HP value */
  currentHP: number;
  /** Max HP (0 for armour when no armour) */
  maxHP: number;
  /** Serious injuries (physical only), 0–3 */
  seriousInjuries?: number;
  /** Serious trauma (mental only), 0–3 */
  seriousTrauma?: number;
  onUpdate: (updates: {
    currentHP?: number;
    seriousInjuries?: number;
    seriousTrauma?: number;
  }) => void;
}

type SessionSnapshot = {
  hp: number;
  injuries: number;
  trauma: number;
};

function sessionHpLost(startHp: number, draftHp: number): number {
  return Math.max(0, startHp - draftHp);
}

function isMajorHpHit(lost: number, maxHp: number): boolean {
  return maxHp > 0 && lost > maxHp / 2;
}

function QuickAdjustRow({
  label,
  value,
  min,
  max,
  onAdjust,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onAdjust: (delta: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-white">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="modalIconStepper"
          fullWidth={false}
          className="disabled:!opacity-40"
          onClick={() => onAdjust(-1)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </Button>
        <span className="min-w-[2.5rem] text-center text-sm font-bold text-white">
          {value}
        </span>
        <Button
          type="button"
          variant="modalIconStepper"
          fullWidth={false}
          className="disabled:!opacity-40"
          onClick={() => onAdjust(1)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </Button>
      </div>
    </div>
  );
}

export function StatEditModal({
  isOpen,
  onClose,
  type,
  currentHP,
  maxHP,
  seriousInjuries = 0,
  seriousTrauma = 0,
  onUpdate,
}: StatEditModalProps) {
  /** Frozen for this mount; parent remounts with `key` when the modal is opened. */
  const [sessionStart] = useState<SessionSnapshot>(() => ({
    hp: currentHP,
    injuries: seriousInjuries,
    trauma: seriousTrauma,
  }));
  const [draftHP, setDraftHP] = useState(() => currentHP);
  const [draftInjuries, setDraftInjuries] = useState(() => seriousInjuries);
  const [draftTrauma, setDraftTrauma] = useState(() => seriousTrauma);

  const flushSessionToParent = () => {
    const start = sessionStart;

    if (type === "physical") {
      const lost = sessionHpLost(start.hp, draftHP);
      const majorHit = isMajorHpHit(lost, maxHP);
      const finalInjuries = majorHit
        ? Math.min(3, draftInjuries + 1)
        : draftInjuries;
      const updates: {
        currentHP?: number;
        seriousInjuries?: number;
        seriousTrauma?: number;
      } = {};
      if (draftHP !== start.hp) updates.currentHP = draftHP;
      if (finalInjuries !== start.injuries) {
        updates.seriousInjuries = finalInjuries;
      }
      if (Object.keys(updates).length > 0) onUpdate(updates);
    } else if (type === "mental") {
      const lost = sessionHpLost(start.hp, draftHP);
      const majorHit = isMajorHpHit(lost, maxHP);
      const finalTrauma = majorHit ? Math.min(3, draftTrauma + 1) : draftTrauma;
      const updates: {
        currentHP?: number;
        seriousInjuries?: number;
        seriousTrauma?: number;
      } = {};
      if (draftHP !== start.hp) updates.currentHP = draftHP;
      if (finalTrauma !== start.trauma) updates.seriousTrauma = finalTrauma;
      if (Object.keys(updates).length > 0) onUpdate(updates);
    } else {
      if (draftHP !== start.hp) onUpdate({ currentHP: draftHP });
    }
  };

  const commitAndClose = () => {
    if (!isOpen) {
      onClose();
      return;
    }
    flushSessionToParent();
    onClose();
  };

  const cancelAndClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const title =
    type === "physical" ? "Physical" : type === "mental" ? "Mental" : "Armour";

  const lost = sessionHpLost(sessionStart.hp, draftHP);
  const majorHit =
    (type === "physical" || type === "mental") && isMajorHpHit(lost, maxHP);

  const displayInjuries =
    type === "physical"
      ? Math.min(3, draftInjuries + (majorHit ? 1 : 0))
      : draftInjuries;

  const displayTrauma =
    type === "mental"
      ? Math.min(3, draftTrauma + (majorHit ? 1 : 0))
      : draftTrauma;

  const handleHPAdjust = (delta: number) => {
    setDraftHP((prev) => Math.max(0, Math.min(maxHP, prev + delta)));
  };

  const adjustManualInjuries = (delta: number) => {
    const startHp = sessionStart.hp;
    setDraftInjuries((prevDraft) => {
      const lostNow = sessionHpLost(startHp, draftHP);
      const hit = isMajorHpHit(lostNow, maxHP);
      const display = Math.min(3, prevDraft + (hit ? 1 : 0));
      const nextDisplay = Math.max(0, Math.min(3, display + delta));
      return Math.max(0, Math.min(3, nextDisplay - (hit ? 1 : 0)));
    });
  };

  const adjustManualTrauma = (delta: number) => {
    const startHp = sessionStart.hp;
    setDraftTrauma((prevDraft) => {
      const lostNow = sessionHpLost(startHp, draftHP);
      const hit = isMajorHpHit(lostNow, maxHP);
      const display = Math.min(3, prevDraft + (hit ? 1 : 0));
      const nextDisplay = Math.max(0, Math.min(3, display + delta));
      return Math.max(0, Math.min(3, nextDisplay - (hit ? 1 : 0)));
    });
  };

  return (
    <ModalShell
      isOpen
      onClose={cancelAndClose}
      title={title}
      titleId="stat-edit-modal-title"
      maxWidthClass="max-w-sm"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="modalPaleOutline"
            fullWidth={false}
            onClick={cancelAndClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="modalPalePrimary"
            fullWidth={false}
            onClick={commitAndClose}
          >
            Save
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {maxHP > 0 && (
          <QuickAdjustRow
            label="HP"
            value={draftHP}
            min={0}
            max={maxHP}
            onAdjust={handleHPAdjust}
          />
        )}

        {type === "physical" && (
          <QuickAdjustRow
            label="Serious injuries"
            value={displayInjuries}
            min={0}
            max={3}
            onAdjust={adjustManualInjuries}
          />
        )}

        {type === "mental" && (
          <QuickAdjustRow
            label="Trauma"
            value={displayTrauma}
            min={0}
            max={3}
            onAdjust={adjustManualTrauma}
          />
        )}

        {type === "armour" && maxHP <= 0 && (
          <p className="text-sm text-white/80">No armour equipped.</p>
        )}
      </div>
    </ModalShell>
  );
}
