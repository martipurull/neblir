"use client";

import { ModalShell } from "@/app/components/shared/ModalShell";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import {
  SafeButton,
  WarningButton,
} from "@/app/components/shared/SemanticActionButton";
import { getInitiativeModifierFromCharacter } from "@/app/lib/equipCombatUtils";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { GameDetail } from "@/app/lib/types/game";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import { submitGameInitiative } from "@/lib/api/game";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export interface InitiativeRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterDetail;
  gameDetails: GameDetail[];
  onRegistered: () => void | Promise<void>;
  /** Close roll modal and open initiative order for this game (after a successful roll). */
  onNavigateToShowOrder: (gameId: string) => void;
}

export function InitiativeRollModal({
  isOpen,
  onClose,
  character,
  gameDetails,
  onRegistered,
  onNavigateToShowOrder,
}: InitiativeRollModalProps) {
  const mod = useMemo(
    () => getInitiativeModifierFromCharacter(character),
    [character]
  );
  const modLabel = `${mod >= 0 ? "+" : ""}${mod}`;

  const [selectedGameId, setSelectedGameId] = useState("");
  const [phase, setPhase] = useState<"pick" | "rolled" | "success" | "error">(
    "pick"
  );
  const [roll, setRoll] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasSubmittedInGame = useCallback(
    (game: GameDetail) =>
      (game.initiativeOrder ?? []).some((e) => e.characterId === character.id),
    [character.id]
  );

  const firstAvailableGameId = useMemo(() => {
    const g = gameDetails.find((gd) => !hasSubmittedInGame(gd));
    return g?.id ?? "";
  }, [gameDetails, hasSubmittedInGame]);

  /** Only reset local state when the modal opens, not when gameDetails refetches after a roll. */
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }
    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setPhase("pick");
      setRoll(null);
      setErrorMessage(null);
      setSubmitting(false);
      setSelectedGameId(
        gameDetails.length === 1 ? gameDetails[0].id : firstAvailableGameId
      );
    }
  }, [isOpen, gameDetails, firstAvailableGameId]);

  /** If the modal opened before game details finished loading, pick a game once ids exist. */
  useEffect(() => {
    if (!isOpen || !wasOpenRef.current) return;
    if (selectedGameId) return;
    const next =
      gameDetails.length === 1
        ? (gameDetails[0]?.id ?? "")
        : firstAvailableGameId;
    if (next) setSelectedGameId(next);
  }, [isOpen, gameDetails, firstAvailableGameId, selectedGameId]);

  const handleGameChange = useCallback((id: string) => {
    setSelectedGameId(id);
    setRoll(null);
    setPhase("pick");
    setErrorMessage(null);
    setSubmitting(false);
  }, []);

  const dropdownOptions = useMemo(
    () =>
      gameDetails.map((g) => ({
        value: g.id,
        label: g.name,
        disabled: hasSubmittedInGame(g),
      })),
    [gameDetails, hasSubmittedInGame]
  );

  const selectedGame = gameDetails.find((g) => g.id === selectedGameId);
  const selectedAllowsRoll =
    selectedGame != null && !hasSubmittedInGame(selectedGame);

  const handleRoll = useCallback(async () => {
    if (!selectedGameId || !selectedAllowsRoll || submitting) return;
    const d = rollD10();
    setRoll(d);
    setPhase("rolled");
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await submitGameInitiative(selectedGameId, {
        characterId: character.id,
        rolledValue: d,
        initiativeModifier: mod,
      });
      await emitRollEvent(selectedGameId, {
        characterId: character.id,
        rollType: "INITIATIVE",
        diceExpression: "1d10",
        results: [d],
        total: d + mod,
        metadata: { initiativeModifier: mod },
      });
      setPhase("success");
      await onRegistered();
    } catch (e) {
      setPhase("error");
      setErrorMessage(
        e instanceof Error ? e.message : "Could not register initiative."
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    selectedGameId,
    selectedAllowsRoll,
    submitting,
    character.id,
    mod,
    onRegistered,
  ]);

  if (!isOpen) return null;

  const total = roll != null ? roll + mod : null;

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title="Initiative roll"
      titleId="initiative-roll-modal-title"
      maxWidthClass="max-w-md"
    >
      <p className="text-sm text-white/90">
        Roll{" "}
        <span className="font-semibold tabular-nums text-white">
          1d10 {modLabel}
        </span>{" "}
        and register the result for the selected game.
      </p>

      {gameDetails.length === 0 ? (
        <p className="mt-4 text-sm text-neblirWarning-300">
          This character is not in any game yet.
        </p>
      ) : gameDetails.length === 1 ? (
        <p className="mt-4 text-sm text-white/80">
          Game:{" "}
          <span className="font-medium text-white">{gameDetails[0].name}</span>
        </p>
      ) : (
        <div className="mt-4">
          <SelectDropdown
            id="initiative-roll-game"
            label="Game"
            placeholder="Select a game"
            value={selectedGameId}
            options={dropdownOptions}
            onChange={handleGameChange}
          />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {phase === "success" && selectedGameId ? (
          <SafeButton
            type="button"
            onClick={() => onNavigateToShowOrder(selectedGameId)}
            className="w-full !border-neblirSafe-200 !text-neblirSafe-200 hover:!bg-neblirSafe-200/20"
          >
            Show initiative
          </SafeButton>
        ) : (
          <WarningButton
            type="button"
            disabled={
              gameDetails.length === 0 ||
              !selectedGameId ||
              !selectedAllowsRoll ||
              submitting
            }
            onClick={() => void handleRoll()}
            className="w-full !border-neblirWarning-200 !text-neblirWarning-200 hover:!bg-neblirWarning-200/20"
          >
            {submitting ? "Registering…" : "Roll initiative"}
          </WarningButton>
        )}

        {roll != null && (
          <div className="rounded border border-white/20 bg-black/20 px-3 py-2 text-sm text-white">
            <p className="tabular-nums">
              d10: <span className="font-semibold">{roll}</span>
              {" · "}
              Modifier: <span className="font-semibold">{modLabel}</span>
              {" · "}
              Total: <span className="font-semibold">{total ?? "—"}</span>
            </p>
          </div>
        )}

        {phase === "success" && selectedGame && (
          <p className="text-sm text-neblirSafe-300">
            Initiative registered for{" "}
            <span className="font-medium">{selectedGame.name}</span>.
          </p>
        )}

        {phase === "error" && errorMessage && (
          <p className="text-sm text-neblirDanger-300">{errorMessage}</p>
        )}
      </div>
    </ModalShell>
  );
}
