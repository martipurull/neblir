"use client";

import { Button } from "@/app/components/shared/Button";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { TextField } from "@/app/components/shared/TextField";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { OfficialBot } from "@/app/lib/types/bot";
import { useImageUrls } from "@/hooks/use-image-urls";
import { addBotToCharacter, getHoldableBots } from "@/lib/api/bots";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useEffect, useMemo, useState } from "react";
import type { KeyedMutator } from "swr";

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
  const [bots, setBots] = useState<OfficialBot[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const official = await getHoldableBots(character.id, controller.signal);
        if (!cancelled) setBots(official);
      } catch (loadError) {
        if (!cancelled) {
          setError(getUserSafeErrorMessage(loadError, "Failed to load bots"));
          setBots([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [character.id]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = query
      ? bots.filter((bot) =>
          [bot.name, bot.description, bot.usage ?? ""]
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
        .map((bot) => ({ id: bot.id, imageKey: bot.imageKey ?? null })),
    [filtered]
  );
  const imageUrls = useImageUrls(imageEntries);

  const handleAdd = async (bot: OfficialBot) => {
    setAddingId(bot.id);
    setError(null);
    try {
      await addBotToCharacter(character.id, { botId: bot.id });
      await mutateAction();
      onCloseAction();
    } catch (addError) {
      setError(getUserSafeErrorMessage(addError, "Failed to add bot"));
    } finally {
      setAddingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={onCloseAction}
      title="Add a bot"
      titleId="add-bot-modal-title"
      subtitle="Add an official bot. One character can hold two of the same bot."
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
          disabled={loading || addingId != null}
        />

        {error ? (
          <p className="text-sm text-neblirDanger-400">{error}</p>
        ) : null}
        {loading ? <p className="text-white/70">Loading bots…</p> : null}

        {!loading ? (
          filtered.length > 0 ? (
            <ul className="space-y-2">
              {filtered.map((bot) => {
                const imageUrl = bot.imageKey ? imageUrls[bot.id] : null;
                const isAdding = addingId === bot.id;
                return (
                  <li key={bot.id}>
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
                              className="h-16 w-16 object-cover object-center"
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
                          {bot.accessType === "GAME_MASTER" ? "GM · " : ""}
                          {bot.maxHp} HP · {bot.confCost} CONF
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-white/55">
                          {bot.description}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="modalPalePrimary"
                        fullWidth={false}
                        disabled={isAdding}
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
