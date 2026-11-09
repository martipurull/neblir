"use client";

import { Button } from "@/app/components/shared/Button";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { TextField } from "@/app/components/shared/TextField";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { BotAccessType } from "@/app/lib/types/bot";
import { useImageUrls } from "@/hooks/use-image-urls";
import { addBotToCharacter, getHoldableBots } from "@/lib/api/bots";
import { fetchGameCustomBots } from "@/lib/api/customBots";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useEffect, useMemo, useState } from "react";
import type { KeyedMutator } from "swr";

type AddableBot = {
  key: string;
  id: string;
  name: string;
  description: string | null;
  usage: string | null;
  maxHp: number;
  confCost: number | null;
  imageKey: string | null;
  accessType?: BotAccessType;
  sourceType: "OFFICIAL" | "CUSTOM";
  gameId?: string;
  gameName?: string;
};

type AddBotToCharacterModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  character: CharacterDetail;
  mutateAction: KeyedMutator<CharacterDetail | null>;
};

export function AddBotToCharacterModal(props: AddBotToCharacterModalProps) {
  if (!props.isOpen) return null;
  return <AddBotToCharacterModalBody key={props.character.id} {...props} />;
}

function AddBotToCharacterModalBody({
  isOpen,
  onCloseAction,
  character,
  mutateAction,
}: AddBotToCharacterModalProps) {
  const [bots, setBots] = useState<AddableBot[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const gameLinks = useMemo(
    () =>
      (character.games ?? []).map((link) => ({
        id: link.game.id,
        name: link.game.name,
      })),
    [character.games]
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const official = await getHoldableBots(character.id, controller.signal);
        const officialRows = official.map(
          (bot): AddableBot => ({
            key: `OFFICIAL:${bot.id}`,
            id: bot.id,
            name: bot.name,
            description: bot.description,
            usage: bot.usage ?? null,
            maxHp: bot.maxHp,
            confCost: bot.confCost,
            imageKey: bot.imageKey ?? null,
            accessType: bot.accessType,
            sourceType: "OFFICIAL",
          })
        );
        let missedAGame = false;
        const customGroups = await Promise.all(
          gameLinks.map(async (link) => {
            try {
              const rows = await fetchGameCustomBots(
                link.id,
                controller.signal
              );
              return rows.map(
                (bot): AddableBot => ({
                  key: `CUSTOM:${bot.id}`,
                  id: bot.id,
                  name: bot.name,
                  description: bot.description ?? null,
                  usage: bot.usage ?? null,
                  maxHp: bot.maxHp,
                  confCost: bot.confCost ?? null,
                  imageKey: null,
                  sourceType: "CUSTOM",
                  gameId: link.id,
                  gameName: link.name,
                })
              );
            } catch (customError) {
              if (
                customError instanceof Error &&
                customError.name === "AbortError"
              ) {
                throw customError;
              }
              missedAGame = true;
              return [];
            }
          })
        );
        if (cancelled) return;
        if (missedAGame) {
          setError(
            "Couldn't load custom bots from every game this character is in."
          );
        }
        setBots([...officialRows, ...customGroups.flat()]);
      } catch (loadError) {
        if (
          cancelled ||
          (loadError instanceof Error && loadError.name === "AbortError")
        ) {
          return;
        }
        setError(getUserSafeErrorMessage(loadError, "Failed to load bots"));
        setBots([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [character.id, gameLinks]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = query
      ? bots.filter((bot) =>
          [bot.name, bot.description ?? "", bot.usage ?? "", bot.gameName ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
      : bots;
    return [...rows].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [bots, search]);

  const imageEntries = useMemo(
    () =>
      filtered
        .filter((bot) => bot.imageKey)
        .map((bot) => ({ id: bot.key, imageKey: bot.imageKey })),
    [filtered]
  );
  const imageUrls = useImageUrls(imageEntries);
  const showGameName = gameLinks.length > 1;

  const handleAdd = async (bot: AddableBot) => {
    setAddingKey(bot.key);
    setError(null);
    try {
      await addBotToCharacter(
        character.id,
        bot.sourceType === "CUSTOM" && bot.gameId
          ? { botId: bot.id, sourceType: "CUSTOM", gameId: bot.gameId }
          : { botId: bot.id }
      );
      await mutateAction();
      onCloseAction();
    } catch (addError) {
      setError(getUserSafeErrorMessage(addError, "Failed to add bot"));
    } finally {
      setAddingKey(null);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={onCloseAction}
      title="Add a bot"
      titleId="add-bot-modal-title"
      subtitle="Add an official bot, or a custom bot from a game this character is in. One character can hold two of the same bot."
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4 text-sm text-white">
        <TextField
          id="add-bot-search"
          type="search"
          variant="dark"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, description, or usage"
          disabled={loading || addingKey != null}
        />

        {error ? (
          <p className="text-sm text-neblirDanger-400">{error}</p>
        ) : null}
        {loading ? <p className="text-white/70">Loading bots…</p> : null}

        {!loading ? (
          filtered.length > 0 ? (
            <ul className="space-y-2">
              {filtered.map((bot) => {
                const imageUrl = bot.imageKey ? imageUrls[bot.key] : null;
                const isAdding = addingKey === bot.key;
                const kind =
                  bot.sourceType === "CUSTOM"
                    ? "Custom"
                    : bot.accessType === "GAME_MASTER"
                      ? "GM"
                      : null;
                return (
                  <li key={bot.key}>
                    <div className="flex items-start gap-3 rounded-md border border-white/20 bg-white/5 p-3">
                      {bot.imageKey ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-transparent">
                          {imageUrl ? (
                            <SignedRemoteImage
                              src={imageUrl}
                              imageKey={bot.imageKey}
                              alt=""
                              width={64}
                              height={64}
                              className="h-16 w-16 object-cover object-top"
                            />
                          ) : imageUrl === undefined ? (
                            <ImageLoadingSkeleton
                              variant="item"
                              className="!bg-transparent"
                            />
                          ) : null}
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{bot.name}</p>
                        <p className="mt-1 text-xs text-white/70">
                          {kind ? `${kind} · ` : ""}
                          {showGameName && bot.gameName
                            ? `${bot.gameName} · `
                            : ""}
                          {bot.maxHp} HP
                          {bot.confCost != null
                            ? ` · ${bot.confCost} CONF`
                            : ""}
                        </p>
                        {bot.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-white/55">
                            {bot.description}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="modalPalePrimary"
                        fullWidth={false}
                        disabled={addingKey != null}
                        onClick={() => {
                          void handleAdd(bot);
                        }}
                      >
                        {isAdding ? "Adding…" : "Add"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-white/65">No bots match your search.</p>
          )
        ) : null}
      </div>
    </ModalShell>
  );
}
