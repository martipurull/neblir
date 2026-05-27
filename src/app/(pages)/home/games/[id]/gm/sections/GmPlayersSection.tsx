import { RemovePlayerFromGameButton } from "@/app/components/games/RemovePlayerFromGameButton";
import { InfoCard } from "@/app/components/shared/InfoCard";
import type { GameDetail } from "@/app/lib/types/game";
import { GmSectionTitle } from "./GmSectionTitle";

type GmPlayersSectionProps = {
  game: GameDetail;
  onPlayerRemoved: () => void | Promise<void>;
};

export function GmPlayersSection({
  game,
  onPlayerRemoved,
}: GmPlayersSectionProps) {
  const players = game.users.filter((gu) => gu.userId !== game.gameMaster);

  return (
    <InfoCard border>
      <GmSectionTitle>Players</GmSectionTitle>
      <p className="mt-1 text-sm text-black/70">
        Members of this game. Removing a player unlinks all of their characters
        and clears their rolls for this game.
      </p>
      {players.length === 0 ? (
        <p className="mt-3 text-sm text-black/60">
          No players in this game yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {players.map((gu) => (
            <li
              key={gu.id}
              className="flex flex-col gap-2 rounded-md border border-black/10 bg-paleBlue/40 px-3 py-2"
            >
              <p className="text-base font-semibold text-black">
                {gu.user.name}
              </p>
              <RemovePlayerFromGameButton
                gameId={game.id}
                userId={gu.userId}
                userName={gu.user.name}
                onRemoved={onPlayerRemoved}
              />
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}
