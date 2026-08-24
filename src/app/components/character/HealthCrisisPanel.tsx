"use client";

import { Button } from "@/app/components/shared/Button";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import {
  crisisPoolIsSuccess,
  deathRollDicePoolSize,
  madnessRollDicePoolSize,
} from "@/app/lib/crisisRoll";
import { rollDie } from "@/app/lib/general-dice";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import type { CharacterDetail } from "@/app/lib/types/character";
import { updateCharacterHealth } from "@/lib/api/character";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { Status } from "@prisma/client";
import { useState } from "react";
import { DangerConfirmModal } from "@/app/components/shared/DangerConfirmModal";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "ALIVE", label: "Alive" },
  { value: "DECEASED", label: "Deceased" },
  { value: "DERANGED", label: "Deranged" },
];

type TrackKind = "death" | "madness";

function emptyTrack() {
  return { successes: 0, failures: 0 };
}

type HealthCrisisPanelProps = {
  character: CharacterDetail;
  readOnly: boolean;
  gameId: string | null;
  rollIsPrivate?: boolean;
  mutate: () => Promise<unknown>;
};

export function HealthCrisisPanel({
  character,
  readOnly,
  gameId,
  rollIsPrivate = false,
  mutate,
}: HealthCrisisPanelProps) {
  const health = character.health;
  const death = health.deathSaves ?? emptyTrack();
  const madness = health.madnessSaves ?? emptyTrack();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastRoll, setLastRoll] = useState<string | null>(null);
  const [resetKind, setResetKind] = useState<TrackKind | null>(null);

  const attrs = character.innateAttributes;
  const deathPool = deathRollDicePoolSize(
    attrs.strength.resilience,
    attrs.constitution.stamina,
    health.seriousPhysicalInjuries
  );
  const madnessPool = madnessRollDicePoolSize(
    attrs.personality.mentality,
    health.seriousTrauma
  );

  const deathStable = death.successes >= 3 && death.failures < 3;
  const madnessComposed = madness.successes >= 3 && madness.failures < 3;
  const deathLocked =
    health.status === "DECEASED" ||
    deathStable ||
    health.currentPhysicalHealth !== 0;
  const madnessLocked =
    health.status !== "ALIVE" ||
    madnessComposed ||
    health.currentMentalHealth !== 0;
  const deathBoxesLocked = health.status === "DECEASED";
  const madnessBoxesLocked =
    health.status === "DECEASED" || health.status === "DERANGED";

  const deathLockReason =
    health.status === "DECEASED"
      ? "Death rolls are locked while status is deceased. Set status to alive if this was a mistake."
      : deathStable
        ? "This character is stable. Heal above 0 HP or reset the death roll to start a new cycle."
        : "Death rolls are only available at 0 physical HP.";
  const madnessLockReason =
    health.status === "DECEASED"
      ? "Madness rolls are locked while status is deceased."
      : health.status === "DERANGED"
        ? "Madness rolls are locked while status is deranged. Set status to alive if this was a mistake."
        : madnessComposed
          ? "This character is composed. Heal above 0 mental HP or reset the madness roll to start a new cycle."
          : "Madness rolls are only available at 0 mental HP while alive.";

  const patchHealth = async (
    body: Parameters<typeof updateCharacterHealth>[1]
  ) => {
    setBusy(true);
    setError(null);
    try {
      await updateCharacterHealth(character.id, body);
      await mutate();
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to update health"));
    } finally {
      setBusy(false);
    }
  };

  const makeRoll = async (kind: TrackKind) => {
    const pool = kind === "death" ? deathPool : madnessPool;
    const dice = Array.from({ length: pool }, () => rollDie(10));
    const success = crisisPoolIsSuccess(dice);
    const track = kind === "death" ? death : madness;
    const next = {
      successes: success ? Math.min(3, track.successes + 1) : track.successes,
      failures: success ? track.failures : Math.min(3, track.failures + 1),
    };
    setLastRoll(
      `${kind === "death" ? "Death" : "Madness"} roll: ${dice.join(", ")} → ${success ? "success" : "failure"}`
    );
    await emitRollEvent(gameId, {
      characterId: character.id,
      isPrivate: rollIsPrivate,
      rollType: "GENERAL_ROLL",
      diceExpression: `${pool}d10`,
      results: dice,
      total: dice.reduce((sum, n) => sum + n, 0),
      metadata: {
        source: kind === "death" ? "deathRoll" : "madnessRoll",
        outcome: success ? "success" : "failure",
      },
    });
    await patchHealth(
      kind === "death" ? { deathSaves: next } : { madnessSaves: next }
    );
  };

  const toggleBox = (
    kind: TrackKind,
    side: "successes" | "failures",
    index: number
  ) => {
    const track = kind === "death" ? { ...death } : { ...madness };
    const current = track[side];
    const nextCount = index < current ? index : index + 1;
    track[side] = nextCount;
    void patchHealth(
      kind === "death" ? { deathSaves: track } : { madnessSaves: track }
    );
  };

  const showDeath =
    health.currentPhysicalHealth === 0 ||
    death.successes > 0 ||
    death.failures > 0;
  const showMadness =
    health.currentMentalHealth === 0 ||
    madness.successes > 0 ||
    madness.failures > 0;

  return (
    <div className="space-y-6">
      {!readOnly ? (
        <div>
          <SelectDropdown
            id="character-status"
            label="Status"
            placeholder="Select status"
            value={health.status}
            options={STATUS_OPTIONS}
            disabled={busy}
            onChange={(value) => {
              void patchHealth({ status: value as Status });
            }}
          />
        </div>
      ) : null}

      {lastRoll ? <p className="text-sm text-black/80">{lastRoll}</p> : null}
      {error ? <p className="text-sm text-neblirDanger-600">{error}</p> : null}

      {showDeath ? (
        <CrisisTrackBlock
          title="Death rolls"
          successes={death.successes}
          failures={death.failures}
          makeDisabled={readOnly || busy || deathLocked}
          makeTitle={deathLocked ? deathLockReason : undefined}
          makeLabel="Make death roll"
          resetDisabled={
            readOnly ||
            busy ||
            deathBoxesLocked ||
            health.currentPhysicalHealth !== 0 ||
            (death.successes === 0 && death.failures === 0)
          }
          boxesDisabled={readOnly || busy || deathBoxesLocked}
          boxesTitle={
            deathBoxesLocked
              ? "Death-roll boxes cannot be changed while status is deceased."
              : undefined
          }
          onMake={() => void makeRoll("death")}
          onReset={() => setResetKind("death")}
          onToggle={(side, index) => toggleBox("death", side, index)}
        />
      ) : null}

      {showMadness ? (
        <CrisisTrackBlock
          title="Madness rolls"
          successes={madness.successes}
          failures={madness.failures}
          makeDisabled={readOnly || busy || madnessLocked}
          makeTitle={madnessLocked ? madnessLockReason : undefined}
          makeLabel="Make madness roll"
          resetDisabled={
            readOnly ||
            busy ||
            madnessBoxesLocked ||
            health.currentMentalHealth !== 0 ||
            (madness.successes === 0 && madness.failures === 0)
          }
          boxesDisabled={readOnly || busy || madnessBoxesLocked}
          boxesTitle={
            madnessBoxesLocked
              ? "Madness-roll boxes cannot be changed while status is deranged or deceased."
              : undefined
          }
          onMake={() => void makeRoll("madness")}
          onReset={() => setResetKind("madness")}
          onToggle={(side, index) => toggleBox("madness", side, index)}
        />
      ) : null}

      <DangerConfirmModal
        isOpen={resetKind != null}
        title={
          resetKind === "madness" ? "Reset madness roll?" : "Reset death roll?"
        }
        description="This clears all success and failure boxes so a new cycle can begin."
        confirmLabel="Reset"
        onCancel={() => setResetKind(null)}
        onConfirm={() => {
          const kind = resetKind;
          setResetKind(null);
          if (kind === "death") {
            void patchHealth({ deathSaves: emptyTrack() });
          } else if (kind === "madness") {
            void patchHealth({ madnessSaves: emptyTrack() });
          }
        }}
      />
    </div>
  );
}

function CrisisTrackBlock({
  title,
  successes,
  failures,
  makeDisabled,
  makeTitle,
  makeLabel,
  resetDisabled,
  boxesDisabled,
  boxesTitle,
  onMake,
  onReset,
  onToggle,
}: {
  title: string;
  successes: number;
  failures: number;
  makeDisabled: boolean;
  makeTitle?: string;
  makeLabel: string;
  resetDisabled: boolean;
  boxesDisabled: boolean;
  boxesTitle?: string;
  onMake: () => void;
  onReset: () => void;
  onToggle: (side: "successes" | "failures", index: number) => void;
}) {
  return (
    <div className="border-t border-black pt-4">
      <span className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
        <span className="h-3 w-px bg-black" aria-hidden />
        {title}
      </span>
      <div className="mt-5 flex w-full gap-6" title={boxesTitle}>
        <TrackBoxes
          label="Successes"
          filled={successes}
          mark="✓"
          disabled={boxesDisabled}
          onToggle={(index) => onToggle("successes", index)}
        />
        <TrackBoxes
          label="Failures"
          filled={failures}
          mark="✗"
          disabled={boxesDisabled}
          onToggle={(index) => onToggle("failures", index)}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span title={makeTitle}>
          <Button
            type="button"
            variant="primarySm"
            fullWidth={false}
            disabled={makeDisabled}
            onClick={onMake}
          >
            {makeLabel}
          </Button>
        </span>
        <span title={resetDisabled ? boxesTitle : undefined}>
          <Button
            type="button"
            variant="secondaryOutlineXs"
            fullWidth={false}
            disabled={resetDisabled}
            onClick={onReset}
          >
            Reset {title.toLowerCase()}
          </Button>
        </span>
      </div>
    </div>
  );
}

function TrackBoxes({
  label,
  filled,
  mark,
  disabled,
  onToggle,
}: {
  label: string;
  filled: number;
  mark: string;
  disabled: boolean;
  onToggle: (index: number) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-black">
        {label}
      </span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <Button
            key={i}
            type="button"
            variant="secondaryOutlineXs"
            fullWidth={false}
            disabled={disabled}
            aria-label={`${label} ${i + 1}`}
            className="h-8 w-8 min-w-8 p-0"
            onClick={() => onToggle(i)}
          >
            {i < filled ? mark : ""}
          </Button>
        ))}
      </div>
    </div>
  );
}
