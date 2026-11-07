"use client";

import { ModalSelect } from "@/app/components/games/shared/ModalSelect";
import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import type { GameDetail } from "@/app/lib/types/game";
import type { BotSourceType } from "@/app/lib/types/bot";
import { fetchGameCustomBots } from "@/lib/api/customBots";
import { getGameOfficialBots, giveBotToCharacter } from "@/lib/api/bots";
import { getGameUniqueBots } from "@/lib/api/uniqueBots";
import { useUser } from "@/hooks/use-user";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useEffect, useState, type FormEvent } from "react";

type GiveBotToCharacterModalProps = {
  isOpen: boolean;
  gameId: string;
  game: GameDetail;
  onClose: () => void;
  onSuccess?: () => void;
};

type BotOption = { id: string; label: string };

export function GiveBotToCharacterModal(props: GiveBotToCharacterModalProps) {
  if (!props.isOpen) return null;
  return <GiveBotToCharacterModalBody key={props.gameId} {...props} />;
}

function GiveBotToCharacterModalBody({
  gameId,
  game,
  onClose,
  onSuccess,
}: GiveBotToCharacterModalProps) {
  const { user } = useUser();
  const [sourceType, setSourceType] = useState<BotSourceType>("OFFICIAL");
  const [botId, setBotId] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [official, setOfficial] = useState<BotOption[]>([]);
  const [custom, setCustom] = useState<BotOption[]>([]);
  const [unique, setUnique] = useState<BotOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [officialRows, customRows, uniqueRows] = await Promise.all([
          getGameOfficialBots(gameId),
          fetchGameCustomBots(gameId),
          getGameUniqueBots(gameId),
        ]);
        if (cancelled) return;
        setOfficial(
          officialRows.map((bot) => ({ id: bot.id, label: bot.name }))
        );
        setCustom(customRows.map((bot) => ({ id: bot.id, label: bot.name })));
        const mine = user?.id;
        setUnique(
          uniqueRows
            .filter(
              (bot) => !bot.held && mine != null && bot.ownerUserId === mine
            )
            .map((bot) => ({ id: bot.id, label: bot.name }))
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(getUserSafeErrorMessage(loadError, "Failed to load bots"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId, user?.id]);

  const options =
    sourceType === "OFFICIAL"
      ? official
      : sourceType === "CUSTOM"
        ? custom
        : unique;
  const characters = game.characters ?? [];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!characterId || !botId) {
      setError("Select a character and a bot.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await giveBotToCharacter(gameId, { characterId, sourceType, botId });
      onSuccess?.();
      onClose();
    } catch (submitError) {
      setError(getUserSafeErrorMessage(submitError, "Failed to give bot"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title="Give bot to character"
      titleId="give-bot-title"
      subtitle="Choose a character and a bot. A unique bot can be given only by the user who minted it, and only while it has no holding."
      closeDisabled={submitting}
      zIndexClass="z-[70]"
      maxWidthClass="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="modalFooterSecondary"
            fullWidth={false}
            className="!border-white/50 font-medium"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="give-bot-modal-form"
            variant="modalFooterPrimary"
            fullWidth={false}
            className="font-medium text-modal-ink disabled:pointer-events-none"
            disabled={submitting || !characterId || !botId}
          >
            {submitting ? "Giving…" : "Give bot"}
          </Button>
        </div>
      }
    >
      <form
        id="give-bot-modal-form"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="space-y-4"
      >
        <ModalSelect
          id="give-bot-character"
          label="Character"
          placeholder={
            characters.length === 0
              ? "No characters in game"
              : "Select character"
          }
          value={characterId}
          options={characters.map((membership) => ({
            value: membership.character.id,
            label:
              [membership.character.name, membership.character.surname]
                .filter(Boolean)
                .join(" ")
                .trim() || "Unnamed",
          }))}
          disabled={submitting || characters.length === 0}
          onChange={setCharacterId}
        />
        <ModalSelect
          id="give-bot-source"
          label="Bot type"
          placeholder="Bot type"
          value={sourceType}
          options={[
            { value: "OFFICIAL", label: "Official bot" },
            { value: "CUSTOM", label: "Custom bot" },
            { value: "UNIQUE", label: "Unique bot" },
          ]}
          disabled={submitting}
          onChange={(value) => {
            setSourceType(value as BotSourceType);
            setBotId("");
          }}
        />
        <ModalSelect
          id="give-bot-bot"
          label="Bot"
          placeholder={
            loading
              ? "Loading…"
              : options.length === 0
                ? "No bots available"
                : "Select a bot"
          }
          value={botId}
          options={options.map((bot) => ({ value: bot.id, label: bot.label }))}
          disabled={submitting || loading || options.length === 0}
          onChange={setBotId}
        />
        {error ? (
          <p className="break-words text-sm text-neblirDanger-400">{error}</p>
        ) : null}
      </form>
    </ModalShell>
  );
}
