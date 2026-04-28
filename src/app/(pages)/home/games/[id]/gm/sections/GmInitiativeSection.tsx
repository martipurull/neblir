import Button from "@/app/components/shared/Button";
import InfoCard from "@/app/components/shared/InfoCard";
import DangerButtonFilled from "@/app/components/shared/DangerButton";
import { DangerButton } from "@/app/components/shared/SemanticActionButton";
import type { GameDetail } from "@/app/lib/types/game";
import React from "react";
import { GmSectionTitle } from "./GmSectionTitle";

type GmInitiativeSectionProps = {
  initiativeOrder: NonNullable<GameDetail["initiativeOrder"]>;
  hasInitiativeEntries: boolean;
  clearingInitiative: boolean;
  initiativeActionId: string | null;
  onClearAll: () => void;
  onRemoveEntry: (characterId: string) => void;
  onAdjustEntry: (characterId: string, initiativeDelta: number) => void;
  onOpenRollModal: () => void;
};

export function GmInitiativeSection({
  initiativeOrder,
  hasInitiativeEntries,
  clearingInitiative,
  initiativeActionId,
  onClearAll,
  onRemoveEntry,
  onAdjustEntry,
  onOpenRollModal,
}: GmInitiativeSectionProps) {
  return (
    <InfoCard border>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <GmSectionTitle>Initiative</GmSectionTitle>
        {hasInitiativeEntries && (
          <DangerButtonFilled
            text={clearingInitiative ? "Clearing…" : "Clear initiative"}
            disabled={clearingInitiative}
            onClick={onClearAll}
            className="!px-3 !py-1.5 !text-xs"
          />
        )}
      </div>

      {!hasInitiativeEntries ? (
        <p className="mt-4 text-sm text-black/70">
          Ask players to roll for initiative or roll initiative for one of the
          GM-controlled characters (NPCs / creatures).
        </p>
      ) : (
        <ul className="divide-y divide-black/15 border-b border-black/15 text-sm text-black">
          {initiativeOrder.map((entry, index) => (
            <li
              key={`${entry.characterId}-${index}`}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="font-medium tabular-nums text-black">
                  {index + 1}.{" "}
                </span>
                {entry.characterName ?? "Character"}
                {entry.characterSurname
                  ? ` ${entry.characterSurname}`
                  : ""}{" "}
                <span className="tabular-nums text-black/80">
                  (total {entry.totalInitiative})
                </span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="secondaryOutlineXs"
                  disabled={initiativeActionId === entry.characterId}
                  onClick={() => onAdjustEntry(entry.characterId, -1)}
                  className="!px-2 !py-1 !text-xs min-w-[2.25rem] justify-center"
                >
                  -1
                </Button>
                <Button
                  type="button"
                  variant="secondaryOutlineXs"
                  disabled={initiativeActionId === entry.characterId}
                  onClick={() => onAdjustEntry(entry.characterId, +1)}
                  className="!px-2 !py-1 !text-xs min-w-[2.25rem] justify-center"
                >
                  +1
                </Button>
                <DangerButton
                  type="button"
                  disabled={initiativeActionId === entry.characterId}
                  onClick={() => onRemoveEntry(entry.characterId)}
                  className="whitespace-nowrap !px-2 !py-1 !text-xs min-w-[7.25rem] justify-center"
                >
                  {initiativeActionId === entry.characterId
                    ? "Updating…"
                    : "Remove"}
                </DangerButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onOpenRollModal}
        >
          Roll initiative
        </Button>
      </div>
    </InfoCard>
  );
}
