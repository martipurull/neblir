"use client";

import { ghostNavButtonClassName } from "@/app/components/shared/buttonStyles";
import { navParentTitleIds, resolveNavParent } from "@/app/lib/navParent";
import {
  formatCharacterDisplayName,
  resolveEntityPageTitle,
} from "@/app/lib/pageTitle";
import { useCharacter } from "@/hooks/use-character";
import { useGame } from "@/hooks/use-game";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function NavSlotPlaceholder() {
  return <div className="inline-block min-h-[2.25rem] min-w-[4rem]" />;
}

export function NavParentLink() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const query = {
    returnTo: searchParams.get("returnTo"),
    gameId: searchParams.get("gameId"),
  };
  const titleIds = navParentTitleIds(pathname, query);
  const {
    game,
    loading: gameLoading,
    error: gameError,
  } = useGame(titleIds.gameId);
  const {
    character,
    loading: characterLoading,
    error: characterError,
  } = useCharacter(titleIds.characterId);

  const gamePending =
    titleIds.gameId != null && game == null && gameError == null && gameLoading;
  const characterPending =
    titleIds.characterId != null &&
    character == null &&
    characterError == null &&
    characterLoading;

  if (gamePending || characterPending) {
    return <NavSlotPlaceholder />;
  }

  const parent = resolveNavParent(pathname, query, {
    gameTitle:
      titleIds.gameId != null
        ? resolveEntityPageTitle(game?.name, "Game")
        : null,
    characterTitle:
      titleIds.characterId != null
        ? resolveEntityPageTitle(
            formatCharacterDisplayName(
              character?.generalInformation.name,
              character?.generalInformation.surname
            ),
            "Character"
          )
        : null,
  });

  if (!("href" in parent)) {
    return <div />;
  }

  return (
    <Link
      href={parent.href}
      className={`${ghostNavButtonClassName} max-w-full truncate`}
      aria-label={parent.label}
    >
      {parent.label}
    </Link>
  );
}
