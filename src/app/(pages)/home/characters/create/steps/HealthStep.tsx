"use client";

import React, { useEffect, useState } from "react";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { useFormContext, useWatch } from "react-hook-form";

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

function clampRolled(value: number, max: number): number {
  const rounded = Number.isFinite(value) ? Math.floor(value) : 10;
  const min = 10;
  return Math.min(max, Math.max(min, rounded));
}

export function HealthStep() {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<CharacterCreationRequest>();
  const level = useWatch({ control, name: "generalInformation.level" }) ?? 1;

  const constitution = useWatch({
    control,
    name: "innateAttributes.constitution",
  });
  const personality = useWatch({
    control,
    name: "innateAttributes.personality",
  });
  const dexterity = useWatch({ control, name: "innateAttributes.dexterity" });
  const strength = useWatch({ control, name: "innateAttributes.strength" });

  const rolledPhysicalHealth =
    useWatch({ control, name: "health.rolledPhysicalHealth" }) ?? 10;
  const rolledMentalHealth =
    useWatch({ control, name: "health.rolledMentalHealth" }) ?? 10;

  const [physicalInput, setPhysicalInput] = useState<string>(
    String(rolledPhysicalHealth)
  );
  const [mentalInput, setMentalInput] = useState<string>(
    String(rolledMentalHealth)
  );

  useEffect(() => {
    setPhysicalInput(String(rolledPhysicalHealth));
  }, [rolledPhysicalHealth]);

  useEffect(() => {
    setMentalInput(String(rolledMentalHealth));
  }, [rolledMentalHealth]);

  const innatePhysicalHealth =
    (constitution?.resistanceExternal ?? 0) +
    (constitution?.resistanceInternal ?? 0) +
    (constitution?.stamina ?? 0);
  const innateMentalHealth =
    (personality?.persuasion ?? 0) +
    (personality?.deception ?? 0) +
    (personality?.mentality ?? 0);

  const maxRolled = 10 * level;
  const maxPhysicalHealth = innatePhysicalHealth + rolledPhysicalHealth;
  const maxMentalHealth = innateMentalHealth + rolledMentalHealth;

  // (No local UI state needed; health values come from the form.)

  const speedMPer6 =
    10 + (dexterity?.agility ?? 0) + (strength?.athletics ?? 0);
  const initiativeMod =
    (personality?.mentality ?? 0) + (dexterity?.agility ?? 0);
  const extraDice = Math.max(0, level - 1);

  const physicalErr = errors.health?.rolledPhysicalHealth?.message;
  const mentalErr = errors.health?.rolledMentalHealth?.message;

  const PhysicalBar = ({
    innate,
    rolled,
    max,
  }: {
    innate: number;
    rolled: number;
    max: number;
  }) => {
    const innatePct = max <= 0 ? 0 : (innate / max) * 100;
    const rolledPct = max <= 0 ? 0 : (rolled / max) * 100;

    return (
      <div className="w-full">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-black/60">Innate: {innate}</span>
          <span className="text-xs text-black/60">Rolled: {rolled}</span>
          <span className="text-xs font-semibold text-black/80">
            Max: {max}
          </span>
        </div>
        <div className="mt-2 flex h-3 overflow-hidden rounded bg-black/10">
          <div
            className="h-full bg-neblirSafe-400"
            style={{ width: `${innatePct}%` }}
          />
          <div
            className="h-full bg-customPrimary"
            style={{ width: `${rolledPct}%` }}
          />
        </div>
      </div>
    );
  };

  type RollModalState = {
    open: boolean;
    dice: number[];
    total: number;
  };

  const [physicalRollModal, setPhysicalRollModal] = useState<RollModalState>({
    open: false,
    dice: [],
    total: 10,
  });
  const [mentalRollModal, setMentalRollModal] = useState<RollModalState>({
    open: false,
    dice: [],
    total: 10,
  });

  const rollWithDice = (diceCount: number) => {
    const dice: number[] = [];
    for (let i = 0; i < diceCount; i++) dice.push(rollD10());
    const total = diceCount <= 0 ? 10 : dice.reduce((a, b) => a + b, 0) + 10;
    return { dice, total };
  };

  return (
    <div className="space-y-5">
      <div className="rounded border border-black/20 bg-black/5 p-3">
        <p className="font-bold text-black">Derived stats</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded border border-black/15 bg-white/70 p-2 text-sm">
            <p className="text-black/60">Speed</p>
            <p className="text-black font-semibold">{speedMPer6} m / 6s</p>
          </div>
          <div className="rounded border border-black/15 bg-white/70 p-2 text-sm">
            <p className="text-black/60">Initiative</p>
            <p className="text-black font-semibold">+{initiativeMod}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded border border-black/20 bg-white/60 p-3">
          <p className="font-bold text-black">Innate physical health</p>
          <p className="mt-1 text-sm text-black/70">
            Resistance External + Resistance Internal + Stamina ={" "}
            <strong>{innatePhysicalHealth}</strong>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const diceCount = Math.max(0, level - 1);
                const { dice, total } = rollWithDice(diceCount);
                setValue("health.rolledPhysicalHealth", total, {
                  shouldDirty: true,
                });
                setPhysicalRollModal({ open: true, dice, total });
              }}
              className="rounded border border-black/30 bg-paleBlue px-3 py-1 text-sm hover:bg-paleBlue hover:brightness-95"
            >
              Roll physical HP
            </button>
            <p className="w-full text-xs text-black/50">
              Rolls <strong>{extraDice}</strong>d10 + 10 (level {level})
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-black/60">Rolled total</label>
              <input
                type="number"
                max={maxRolled}
                value={physicalInput}
                onChange={(e) => {
                  setPhysicalInput(e.target.value);
                }}
                onBlur={() => {
                  const next = Number.parseInt(physicalInput, 10);
                  if (Number.isNaN(next)) {
                    setPhysicalInput(String(rolledPhysicalHealth));
                    return;
                  }
                  const safe = clampRolled(next, maxRolled);
                  setValue("health.rolledPhysicalHealth", safe, {
                    shouldDirty: true,
                  });
                  setPhysicalInput(String(safe));
                }}
                className="w-24 rounded-md border border-black/20 bg-paleBlue px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover"
              />
              <span className="text-xs text-black/40">max {maxRolled}</span>
            </div>
          </div>
          {physicalErr && (
            <p className="mt-2 text-sm text-neblirDanger-600" role="alert">
              {physicalErr}
            </p>
          )}
          <div className="mt-3">
            <PhysicalBar
              innate={innatePhysicalHealth}
              rolled={rolledPhysicalHealth}
              max={maxPhysicalHealth}
            />
          </div>
        </div>

        <div className="rounded border border-black/20 bg-white/60 p-3">
          <p className="font-bold text-black">Innate mental health</p>
          <p className="mt-1 text-sm text-black/70">
            Persuasion + Deception + Mentality ={" "}
            <strong>{innateMentalHealth}</strong>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const diceCount = Math.max(0, level - 1);
                const { dice, total } = rollWithDice(diceCount);
                setValue("health.rolledMentalHealth", total, {
                  shouldDirty: true,
                });
                setMentalRollModal({ open: true, dice, total });
              }}
              className="rounded border border-black/30 bg-paleBlue px-3 py-1 text-sm hover:bg-paleBlue hover:brightness-95"
            >
              Roll mental HP
            </button>
            <p className="w-full text-xs text-black/50">
              Rolls <strong>{extraDice}</strong>d10 + 10 (level {level})
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-black/60">Rolled total</label>
              <input
                type="number"
                max={maxRolled}
                value={mentalInput}
                onChange={(e) => {
                  setMentalInput(e.target.value);
                }}
                onBlur={() => {
                  const next = Number.parseInt(mentalInput, 10);
                  if (Number.isNaN(next)) {
                    setMentalInput(String(rolledMentalHealth));
                    return;
                  }
                  const safe = clampRolled(next, maxRolled);
                  setValue("health.rolledMentalHealth", safe, {
                    shouldDirty: true,
                  });
                  setMentalInput(String(safe));
                }}
                className="w-24 rounded-md border border-black/20 bg-paleBlue px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover"
              />
              <span className="text-xs text-black/40">max {maxRolled}</span>
            </div>
          </div>
          {mentalErr && (
            <p className="mt-2 text-sm text-neblirDanger-600" role="alert">
              {mentalErr}
            </p>
          )}
          <div className="mt-3">
            <PhysicalBar
              innate={innateMentalHealth}
              rolled={rolledMentalHealth}
              max={maxMentalHealth}
            />
          </div>
        </div>
      </div>

      {(physicalRollModal.open || mentalRollModal.open) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded border border-black/20 bg-white p-4 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-black">
                  {physicalRollModal.open
                    ? "Physical HP roll"
                    : "Mental HP roll"}
                </p>
                <p className="mt-1 text-xs text-black/60">
                  Rolls: {extraDice}d10 + 10
                </p>
              </div>
              <button
                type="button"
                className="rounded border border-black/20 bg-black/5 px-2 py-1 text-xs text-black/70 hover:bg-black/10"
                onClick={() => {
                  setPhysicalRollModal((p) => ({ ...p, open: false }));
                  setMentalRollModal((m) => ({ ...m, open: false }));
                }}
              >
                Close
              </button>
            </div>

            <div className="mt-3 rounded border border-black/10 bg-black/0 p-3">
              {(() => {
                const state = physicalRollModal.open
                  ? physicalRollModal
                  : mentalRollModal;
                return (
                  <>
                    <p className="text-sm font-medium text-black">
                      Dice ({state.dice.length}):{" "}
                      {state.dice.length > 0 ? state.dice.join(", ") : "none"}
                    </p>
                    <p className="mt-1 text-sm text-black/70">
                      Total:{" "}
                      <span className="font-semibold text-black">
                        {state.total}
                      </span>
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
