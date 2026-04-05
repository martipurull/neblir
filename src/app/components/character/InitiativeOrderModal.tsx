"use client";

import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import type { GameDetail } from "@/app/lib/types/game";
import React, { useEffect, useMemo, useState } from "react";

export interface InitiativeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameDetails: GameDetail[];
  /** When set (e.g. after rolling initiative), select this game when the modal opens. */
  initialGameId?: string | null;
}

export function InitiativeOrderModal({
  isOpen,
  onClose,
  gameDetails,
  initialGameId,
}: InitiativeOrderModalProps) {
  const [selectedGameId, setSelectedGameId] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      if (initialGameId && gameDetails.some((g) => g.id === initialGameId)) {
        setSelectedGameId(initialGameId);
        return;
      }
      if (gameDetails.length === 1) {
        setSelectedGameId(gameDetails[0].id);
      } else if (gameDetails.length > 1) {
        setSelectedGameId((prev) =>
          prev && gameDetails.some((g) => g.id === prev)
            ? prev
            : (gameDetails[0]?.id ?? "")
        );
      }
    });
  }, [isOpen, gameDetails, initialGameId]);

  const selectedGame = gameDetails.find((g) => g.id === selectedGameId);
  const order = selectedGame?.initiativeOrder ?? [];

  const dropdownOptions = useMemo(
    () =>
      gameDetails.map((g) => ({
        value: g.id,
        label: g.name,
      })),
    [gameDetails]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="initiative-order-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            id="initiative-order-modal-title"
            className="text-lg font-semibold text-white"
          >
            Initiative order
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white transition-colors hover:bg-paleBlue/10"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        {gameDetails.length === 0 ? (
          <p className="mt-4 text-sm text-white/80">
            This character is not in any game.
          </p>
        ) : (
          <>
            {gameDetails.length > 1 && (
              <div className="mt-4">
                <SelectDropdown
                  id="initiative-order-game"
                  label="Game"
                  placeholder="Select a game"
                  value={selectedGameId}
                  options={dropdownOptions}
                  onChange={setSelectedGameId}
                />
              </div>
            )}

            {gameDetails.length === 1 && (
              <p className="mt-4 text-sm text-white/80">
                <span className="font-medium text-white">
                  {gameDetails[0].name}
                </span>
              </p>
            )}

            <ul className="mt-4 max-h-64 divide-y divide-white/15 overflow-y-auto rounded border border-white/15">
              {order.length === 0 ? (
                <li className="px-3 py-3 text-sm text-white/60">
                  No initiative recorded for this game (or the GM cleared it).
                </li>
              ) : (
                order.map((entry, index) => (
                  <li
                    key={`${entry.characterId}-${index}`}
                    className="flex items-baseline justify-between gap-2 px-3 py-2.5 text-sm text-white"
                  >
                    <span className="shrink-0 font-medium tabular-nums text-white/90">
                      {index + 1}.
                    </span>
                    <span className="min-w-0 flex-1 truncate text-left">
                      {entry.characterName ?? "Character"}{" "}
                      {entry.characterSurname ? (
                        <span className="text-white/80">
                          {entry.characterSurname}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 tabular-nums text-white/90">
                      {entry.totalInitiative}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
