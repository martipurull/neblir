import { gameMasterTableSettingsPath } from "@/app/lib/gameMasterPaths";
import Link from "next/link";

type GmTableSettingsCardProps = {
  gameId: string;
};

export function GmTableSettingsCard({ gameId }: GmTableSettingsCardProps) {
  return (
    <Link
      href={gameMasterTableSettingsPath(gameId)}
      className="block rounded-md border border-black p-4 transition-colors duration-200 ease-in-out md:hover:bg-paleBlue/30"
    >
      <h2 className="text-base font-semibold text-black">Table Settings</h2>
      <p className="mt-1 text-sm text-black/70">
        Players, lore, recaps, files, invites, Discord, premise, cover image,
        and danger zone.
      </p>
    </Link>
  );
}
