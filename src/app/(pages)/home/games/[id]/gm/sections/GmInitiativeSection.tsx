import Button from "@/app/components/shared/Button";
import InfoCard from "@/app/components/shared/InfoCard";
import type { GameDetail } from "@/app/lib/types/game";
import { GmSectionTitle } from "./GmSectionTitle";

type GmInitiativeSectionProps = {
  initiativeOrder: NonNullable<GameDetail["initiativeOrder"]>;
  hasInitiativeEntries: boolean;
  clearingInitiative: boolean;
  initiativeActionId: string | null;
  onClearAll: () => void;
  onRemoveEntry: (combatantRef: string) => void;
  onAdjustEntry: (combatantRef: string, initiativeDelta: number) => void;
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
          <Button
            type="button"
            variant="danger"
            fullWidth={false}
            disabled={clearingInitiative}
            onClick={onClearAll}
            className="!px-3 !py-1.5 !text-xs"
          >
            {clearingInitiative ? "Clearing…" : "Clear initiative"}
          </Button>
        )}
      </div>

      {!hasInitiativeEntries ? (
        <p className="mt-4 text-sm text-black/70">
          Ask players to roll for initiative or roll initiative for one of the
          GM-controlled characters (NPCs / creatures).
        </p>
      ) : (
        <ul className="divide-y divide-black/15 border-b border-black/15 text-sm text-black">
          {initiativeOrder.map((entry, index) => {
            const combatantRef = `${entry.combatantType}:${entry.combatantId}`;
            return (
              <li
                key={`${combatantRef}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <span className="min-w-0 flex-1">
                  <span className="font-medium tabular-nums text-black">
                    {index + 1}.{" "}
                  </span>
                  {entry.displayName ?? "Combatant"}
                  {entry.displaySurname ? ` ${entry.displaySurname}` : ""}{" "}
                  <span className="tabular-nums text-black/80">
                    (total {entry.totalInitiative})
                  </span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="secondaryOutlineXs"
                    disabled={initiativeActionId === combatantRef}
                    onClick={() => onAdjustEntry(combatantRef, -1)}
                    className="!px-2 !py-1 !text-xs min-w-[2.25rem] justify-center"
                  >
                    -1
                  </Button>
                  <Button
                    type="button"
                    variant="secondaryOutlineXs"
                    disabled={initiativeActionId === combatantRef}
                    onClick={() => onAdjustEntry(combatantRef, +1)}
                    className="!px-2 !py-1 !text-xs min-w-[2.25rem] justify-center"
                  >
                    +1
                  </Button>
                  <Button
                    type="button"
                    variant="semanticDangerOutline"
                    fullWidth={false}
                    disabled={initiativeActionId === combatantRef}
                    onClick={() => onRemoveEntry(combatantRef)}
                    className="whitespace-nowrap !px-2 !py-1 !text-xs min-w-[7.25rem] justify-center"
                  >
                    {initiativeActionId === combatantRef
                      ? "Updating…"
                      : "Remove"}
                  </Button>
                </div>
              </li>
            );
          })}
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
