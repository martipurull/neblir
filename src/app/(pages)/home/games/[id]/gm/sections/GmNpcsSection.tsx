import InfoCard from "@/app/components/shared/InfoCard";
import type { GameDetail } from "@/app/lib/types/game";
import { isGmControlledGameCharacter } from "@/app/lib/gmInitiativeUtils";
import Button from "@/app/components/shared/Button";
import Link from "next/link";
import { useMemo, useState } from "react";
import { GmSectionTitle } from "./GmSectionTitle";

type GmNpcsSectionProps = {
  game: GameDetail;
  onSetVisibility: (characterId: string, isPublic: boolean) => Promise<void>;
};

export function GmNpcsSection({ game, onSetVisibility }: GmNpcsSectionProps) {
  const [updatingCharacterId, setUpdatingCharacterId] = useState<string | null>(
    null
  );
  const [updateError, setUpdateError] = useState<string | null>(null);

  const npcRows = useMemo(
    () =>
      (game.characters ?? []).filter((gc) =>
        isGmControlledGameCharacter(gc, game)
      ),
    [game]
  );

  const publicNpcs = npcRows.filter((gc) => gc.isPublic ?? true);
  const privateNpcs = npcRows.filter((gc) => !(gc.isPublic ?? true));

  const renderNpcList = (
    rows: typeof npcRows,
    emptyText: string,
    visibility: "Public" | "Private"
  ) => {
    if (rows.length === 0) {
      return <p className="text-sm text-black/70">{emptyText}</p>;
    }
    return (
      <ul className="space-y-2">
        {rows.map((gc) => {
          const char = gc.character;
          const name = `${char.name}${char.surname ? ` ${char.surname}` : ""}`;
          const isBusy = updatingCharacterId === char.id;
          const targetVisibility = visibility === "Public" ? false : true;
          const toggleLabel =
            visibility === "Public" ? "Make private" : "Make public";
          return (
            <li
              key={gc.id}
              className="flex flex-col gap-2 rounded-md border border-black/10 bg-paleBlue/40 px-3 py-2 sm:flex-row sm:items-center sm:gap-3"
            >
              <Link
                href={`/home/characters/${char.id}?returnTo=${encodeURIComponent(`/home/games/${game.id}/gm`)}`}
                className="min-w-0 w-full rounded-sm focus:outline-none focus:ring-2 focus:ring-black/30 sm:basis-2/3"
              >
                <p className="truncate text-base font-semibold text-black underline-offset-2 hover:underline">
                  {name}
                </p>
                <p className="text-sm text-black/65">
                  Level {char.generalInformation?.level ?? "—"}
                </p>
              </Link>
              <div className="w-full sm:basis-1/3">
                <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                  <span
                    className={[
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      visibility === "Public"
                        ? "border-neblirSafe-400/50 bg-neblirSafe-200/30 text-black"
                        : "border-neblirDanger-300/50 bg-neblirDanger-100/40 text-black",
                    ].join(" ")}
                  >
                    {visibility}
                  </span>
                  <Button
                    type="button"
                    variant="solidDark"
                    className="text-xs max-sm:w-full"
                    fullWidth={false}
                    disabled={isBusy}
                    onClick={() => {
                      setUpdateError(null);
                      setUpdatingCharacterId(char.id);
                      void onSetVisibility(char.id, targetVisibility)
                        .catch((error) => {
                          setUpdateError(
                            error instanceof Error
                              ? error.message
                              : "Failed to update visibility."
                          );
                        })
                        .finally(() => {
                          setUpdatingCharacterId(null);
                        });
                    }}
                  >
                    {isBusy ? "Updating..." : toggleLabel}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <InfoCard border>
      <GmSectionTitle>NPCs</GmSectionTitle>
      <p className="mt-1 text-sm text-black/70">
        NPCs linked to this game, grouped by player visibility.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold text-black">
            Public to players
          </h3>
          <div className="mt-2">
            {renderNpcList(publicNpcs, "No public NPCs yet.", "Public")}
          </div>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-black">Private to GM</h3>
          <div className="mt-2">
            {renderNpcList(privateNpcs, "No private NPCs yet.", "Private")}
          </div>
        </section>
      </div>
      {updateError ? (
        <p className="mt-3 text-sm text-neblirDanger-400">{updateError}</p>
      ) : null}
    </InfoCard>
  );
}
