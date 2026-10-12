import { RemoveCharacterFromGameButton } from "@/app/components/games/RemoveCharacterFromGameButton";
import { Button } from "@/app/components/shared/Button";
import { gmNpcCardActionClassName } from "@/app/components/shared/buttonStyles";
import { RemoteAvatar } from "@/app/components/shared/RemoteAvatar";
import { gmLinkedCharacterSheetHref } from "@/app/lib/navParent";
import type { GameDetail } from "@/app/lib/types/game";
import {
  linkVisibilityBadgeClassName,
  linkVisibilityLabel,
} from "@/app/lib/visibilityBadge";
import Link from "next/link";
import { GmInitiativeRollButton } from "./GmInitiativeRollButton";
import { GmNpcGroupField } from "./GmNpcGroupField";

type GameNpcRow = NonNullable<GameDetail["characters"]>[number];

type GmNpcCardProps = {
  gameId: string;
  row: GameNpcRow;
  imageUrl?: string | null;
  isPublic: boolean;
  busy: boolean;
  visibilityUpdating: boolean;
  isRolling: boolean;
  hasRolled: boolean;
  groupNames: readonly string[];
  onToggleVisibility: () => void;
  onSetGroup: (npcGroup: string | null) => void;
  onRoll: () => void;
  onRemoved: () => void | Promise<void>;
};

export function GmNpcCard({
  gameId,
  row,
  imageUrl,
  isPublic,
  busy,
  visibilityUpdating,
  isRolling,
  hasRolled,
  groupNames,
  onToggleVisibility,
  onSetGroup,
  onRoll,
  onRemoved,
}: GmNpcCardProps) {
  const char = row.character;
  const name = `${char.name}${char.surname ? ` ${char.surname}` : ""}`;
  const visibilityLabel = linkVisibilityLabel(isPublic);
  const toggleLabel = isPublic ? "Make private" : "Make public";

  return (
    <li className="flex flex-col gap-2 rounded-md border border-black/10 bg-paleBlue/40 px-3 py-2">
      <div className="flex items-center gap-3">
        <Link
          href={gmLinkedCharacterSheetHref({
            characterId: char.id,
            gameId,
            ownedByCurrentUser: char.isOwnedByCurrentUser,
          })}
          className="min-w-0 flex-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-black/30"
        >
          <div className="flex items-center gap-3">
            <RemoteAvatar
              imageUrl={imageUrl}
              imageKey={char.avatarKey}
              alt={`${name} avatar`}
              size={44}
              className="h-11 w-11 shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-black underline-offset-2 hover:underline">
                {name}
              </p>
              {row.playGrant ? (
                <span className="mt-1 inline-block rounded-full border border-black/20 bg-paleBlue/80 px-2 py-0.5 text-xs font-medium text-black">
                  {row.playGrant.name}
                </span>
              ) : null}
              <p className="text-sm text-black/65">
                Level {char.generalInformation?.level ?? "—"}
              </p>
            </div>
          </div>
        </Link>
        <span className={`${linkVisibilityBadgeClassName(isPublic)} shrink-0`}>
          {visibilityLabel}
        </span>
      </div>
      <GmNpcGroupField
        key={`${char.id}:${row.npcGroup ?? ""}`}
        characterId={char.id}
        currentGroup={row.npcGroup ?? null}
        groupNames={groupNames}
        disabled={busy || isRolling}
        onSetGroup={onSetGroup}
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-stretch">
        <Button
          type="button"
          variant="solidDark"
          className={gmNpcCardActionClassName}
          fullWidth
          disabled={busy || isRolling}
          onClick={onToggleVisibility}
        >
          {visibilityUpdating ? "Updating..." : toggleLabel}
        </Button>
        <GmInitiativeRollButton
          hasRolled={hasRolled}
          busy={isRolling}
          modifier={char.initiativeMod ?? 0}
          disabled={busy}
          fullWidth
          className={gmNpcCardActionClassName}
          onClick={onRoll}
        />
        <RemoveCharacterFromGameButton
          gameId={gameId}
          characterId={char.id}
          characterName={name}
          fullWidth
          buttonClassName={gmNpcCardActionClassName}
          onRemoved={onRemoved}
        />
      </div>
    </li>
  );
}
