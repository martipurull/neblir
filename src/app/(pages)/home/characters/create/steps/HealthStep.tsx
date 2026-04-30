"use client";

import { useEffect, useState } from "react";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { useFormContext, useWatch } from "react-hook-form";
import Button from "@/app/components/shared/Button";

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

function clampRolled(value: number, min: number, max: number): number {
  const rounded = Number.isFinite(value) ? Math.floor(value) : 10;
  return Math.min(max, Math.max(min, rounded));
}

interface HealthStepProps {
  clampOnBlur?: boolean;
}

export function HealthStep({ clampOnBlur = true }: HealthStepProps) {
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
  const minRolled = 10 + Math.max(0, level - 1);
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
    danger = false,
  }: {
    innate: number;
    rolled: number;
    max: number;
    danger?: boolean;
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
            className={
              danger ? "h-full bg-neblirDanger-300" : "h-full bg-neblirSafe-400"
            }
            style={{ width: `${innatePct}%` }}
          />
          <div
            className={
              danger ? "h-full bg-neblirDanger-600" : "h-full bg-customPrimary"
            }
            style={{ width: `${rolledPct}%` }}
          />
        </div>
      </div>
    );
  };
  const isPhysicalOutOfRange =
    rolledPhysicalHealth < minRolled || rolledPhysicalHealth > maxRolled;
  const isMentalOutOfRange =
    rolledMentalHealth < minRolled || rolledMentalHealth > maxRolled;

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
          <div className="rounded border border-black/15 bg-transparent p-2 text-sm">
            <p className="text-black/60">Speed</p>
            <p className="text-black font-semibold">{speedMPer6} m / 6s</p>
          </div>
          <div className="rounded border border-black/15 bg-transparent p-2 text-sm">
            <p className="text-black/60">Initiative</p>
            <p className="text-black font-semibold">+{initiativeMod}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border border-black/20 bg-transparent p-3">
          <p className="font-bold text-black">Innate physical health</p>
          <p className="mt-1 text-sm text-black/70">
            Resistance External + Resistance Internal + Stamina ={" "}
            <strong>{innatePhysicalHealth}</strong>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="semanticSafeFilled"
              fullWidth={false}
              onClick={() => {
                const diceCount = Math.max(0, level - 1);
                const { dice, total } = rollWithDice(diceCount);
                setValue("health.rolledPhysicalHealth", total, {
                  shouldDirty: true,
                });
                setPhysicalRollModal({ open: true, dice, total });
              }}
              className="px-3 py-1 text-sm"
            >
              Roll physical HP
            </Button>
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
                  const safe = clampOnBlur
                    ? clampRolled(next, minRolled, maxRolled)
                    : next;
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
              danger={isPhysicalOutOfRange}
            />
          </div>
        </div>

        <div className="rounded border border-black/20 bg-transparent p-3">
          <p className="font-bold text-black">Innate mental health</p>
          <p className="mt-1 text-sm text-black/70">
            Persuasion + Deception + Mentality ={" "}
            <strong>{innateMentalHealth}</strong>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="semanticSafeFilled"
              fullWidth={false}
              onClick={() => {
                const diceCount = Math.max(0, level - 1);
                const { dice, total } = rollWithDice(diceCount);
                setValue("health.rolledMentalHealth", total, {
                  shouldDirty: true,
                });
                setMentalRollModal({ open: true, dice, total });
              }}
              className="px-3 py-1 text-sm"
            >
              Roll mental HP
            </Button>
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
                  const safe = clampOnBlur
                    ? clampRolled(next, minRolled, maxRolled)
                    : next;
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
              danger={isMentalOutOfRange}
            />
          </div>
        </div>
      </div>

      {(physicalRollModal.open || mentalRollModal.open) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="health-hp-roll-title"
          onClick={() => {
            setPhysicalRollModal((p) => ({ ...p, open: false }));
            setMentalRollModal((m) => ({ ...m, open: false }));
          }}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded border border-black/20 bg-modalBackground-200 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/15 px-4 py-3">
              <div>
                <p
                  id="health-hp-roll-title"
                  className="text-sm font-semibold text-black"
                >
                  {physicalRollModal.open
                    ? "Physical HP roll"
                    : "Mental HP roll"}
                </p>
                <p className="mt-1 text-xs text-black/60">
                  Rolls: {extraDice}d10 + 10
                </p>
              </div>
              <Button
                type="button"
                variant="modalCloseLight"
                fullWidth={false}
                aria-label="Close roll results"
                onClick={() => {
                  setPhysicalRollModal((p) => ({ ...p, open: false }));
                  setMentalRollModal((m) => ({ ...m, open: false }));
                }}
              >
                ×
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="rounded border border-black/10 bg-modalBackground-200 p-3">
                {(() => {
                  const state = physicalRollModal.open
                    ? physicalRollModal
                    : mentalRollModal;
                  return (
                    <>
                      <p className="text-sm font-medium text-customSecondary">
                        Dice ({state.dice.length}):{" "}
                        {state.dice.length > 0 ? state.dice.join(", ") : "none"}
                      </p>
                      <p className="mt-1 text-sm text-customSecondary/70">
                        Total:{" "}
                        <span className="font-semibold text-customSecondary">
                          {state.total}
                        </span>
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
