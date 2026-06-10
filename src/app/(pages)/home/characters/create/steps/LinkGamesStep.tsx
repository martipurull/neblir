"use client";

import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { useGames } from "@/hooks/use-games";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";

function defaultLinkIsPublic(isGameMaster: boolean): boolean {
  return !isGameMaster;
}

export function LinkGamesStep() {
  const searchParams = useSearchParams();
  const linkGameId = searchParams.get("gameId");
  const gameLinkIsPublic =
    searchParams.get("gameLinkIsPublic") === "1" ||
    searchParams.get("gameLinkIsPublic") === "true";
  const { games, loading, error } = useGames();
  const { watch, setValue, getValues } =
    useFormContext<CharacterCreationRequest>();
  const gameLinks = watch("gameLinks") ?? [];
  const defaultAppliedRef = useRef(false);

  useEffect(() => {
    if (linkGameId || loading || defaultAppliedRef.current) return;
    if (games.length !== 1) return;
    const current = getValues("gameLinks") ?? [];
    if (current.length > 0) {
      defaultAppliedRef.current = true;
      return;
    }
    const game = games[0];
    setValue(
      "gameLinks",
      [
        {
          gameId: game.id,
          isPublic: defaultLinkIsPublic(game.isGameMaster === true),
        },
      ],
      { shouldDirty: false }
    );
    defaultAppliedRef.current = true;
  }, [games, getValues, linkGameId, loading, setValue]);

  if (linkGameId) {
    const linkedGame = games.find((g) => g.id === linkGameId);
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <p className="text-sm text-black/70">
          Review your choices, then create the character. It will be linked to{" "}
          <span className="font-semibold text-black">
            {linkedGame?.name ?? "your game"}
          </span>
          .
        </p>
        <p className="text-sm text-black/70">
          Visibility in that game:{" "}
          <span className="font-semibold text-black">
            {gameLinkIsPublic
              ? "Visible to other players"
              : "Private to you (GM only)"}
          </span>
          .
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <p className="mx-auto max-w-2xl text-sm text-black/60">
        Loading your games…
      </p>
    );
  }

  if (error) {
    return (
      <p
        className="mx-auto max-w-2xl text-sm text-neblirDanger-600"
        role="alert"
      >
        Could not load your games. You can still create this character and link
        it to a game later.
      </p>
    );
  }

  const isLinked = (gameId: string) =>
    gameLinks.some((link) => link.gameId === gameId);

  const getLink = (gameId: string) =>
    gameLinks.find((link) => link.gameId === gameId);

  const toggleGame = (
    gameId: string,
    checked: boolean,
    isGameMaster: boolean
  ) => {
    const next = checked
      ? [...gameLinks, { gameId, isPublic: defaultLinkIsPublic(isGameMaster) }]
      : gameLinks.filter((link) => link.gameId !== gameId);
    setValue("gameLinks", next, { shouldDirty: true });
  };

  const setVisibility = (gameId: string, isPublic: boolean) => {
    setValue(
      "gameLinks",
      gameLinks.map((link) =>
        link.gameId === gameId ? { ...link, isPublic } : link
      ),
      { shouldDirty: true }
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <p className="text-sm text-black/70">
        Optionally link this character to one or more of your games, then click{" "}
        <span className="font-semibold text-black">Create character</span>{" "}
        below. You can change links later from the character or game screens.
      </p>

      {games.length === 0 ? (
        <p className="text-sm text-black/60">
          You are not registered for any games yet. Skip this step and link the
          character later.
        </p>
      ) : (
        <ul className="space-y-3">
          {games.map((game) => {
            const linked = isLinked(game.id);
            const link = getLink(game.id);
            return (
              <li
                key={game.id}
                className="rounded border border-black/20 bg-black/[0.02] p-3"
              >
                <Checkbox
                  checked={linked}
                  onChange={(checked) =>
                    toggleGame(game.id, checked, game.isGameMaster === true)
                  }
                  label={game.name}
                />
                {linked && link ? (
                  <div className="mt-2 border-t border-black/10 pt-2 pl-6">
                    <Checkbox
                      checked={link.isPublic}
                      onChange={(isPublic) => setVisibility(game.id, isPublic)}
                      label="Visible to other players in this game"
                    />
                    <p className="mt-1 text-xs text-black/65">
                      {game.isGameMaster
                        ? "As game master, leave unchecked to keep this link private (like an NPC only you see)."
                        : "Leave unchecked to hide this character from other players; you and the GM can still see it."}
                    </p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
