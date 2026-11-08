"use client";

import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { TextField } from "@/app/components/shared/TextField";
import type { OfficialBot } from "@/app/lib/types/bot";
import { useImageUrls } from "@/hooks/use-image-urls";
import { getGameOfficialBots } from "@/lib/api/bots";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useEffect, useMemo, useState } from "react";

type BrowseBotsModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  onClose: () => void;
};

function displayText(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "—";
}

export function BrowseBotsModal(props: BrowseBotsModalProps) {
  if (!props.isOpen) return null;
  return <BrowseBotsModalContent {...props} />;
}

function BrowseBotsModalContent({
  gameId,
  gameName,
  onClose,
}: BrowseBotsModalProps) {
  const [bots, setBots] = useState<OfficialBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    let cancelled = false;
    void getGameOfficialBots(gameId)
      .then((rows) => {
        if (cancelled) return;
        setBots(rows);
        setSelectedId((current) =>
          current.length > 0 ? current : (rows[0]?.id ?? "")
        );
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(getUserSafeErrorMessage(loadError, "Failed to load bots"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...bots].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
    if (!query) return sorted;
    return sorted.filter((bot) =>
      [bot.name, bot.description, bot.usage ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [bots, search]);

  const selected = useMemo(
    () => filtered.find((bot) => bot.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  );

  const imageUrls = useImageUrls(
    bots.map((bot) => ({ id: bot.id, imageKey: bot.imageKey ?? null }))
  );

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title={`Browse official bots — ${gameName}`}
      titleId="browse-official-bots-title"
      maxWidthClass="max-w-4xl"
    >
      <p className="mt-1 text-xs text-white/70">
        Official bots, including frames only a game master can hold.
      </p>
      <div className="mt-3">
        <TextField
          id="browse-official-bots-search"
          type="search"
          variant="dark"
          density="compact"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search official bots…"
          aria-label="Search official bots"
        />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="max-h-[55vh] overflow-y-auto rounded border border-white/20 p-2">
          {loading ? (
            <p className="px-2 py-3 text-sm text-white/75">Loading bots…</p>
          ) : filtered.length === 0 ? (
            <p className="px-2 py-3 text-sm text-white/75">No official bots.</p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((bot) => (
                <li key={bot.id}>
                  <Button
                    type="button"
                    variant={
                      selected?.id === bot.id
                        ? "modalBrowseListRowSelected"
                        : "modalBrowseListRow"
                    }
                    fullWidth={false}
                    className="w-full"
                    onClick={() => setSelectedId(bot.id)}
                  >
                    <span className="truncate">{bot.name}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="max-h-[55vh] overflow-y-auto rounded border border-white/20 p-3">
          {!selected ? (
            <p className="text-sm text-white/75">Select a bot to view it.</p>
          ) : (
            <OfficialBotDetail
              bot={selected}
              imageUrl={selected.imageKey ? imageUrls[selected.id] : null}
            />
          )}
        </div>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-neblirDanger-300">{error}</p>
      ) : null}
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="secondaryOutlineXs" onClick={onClose}>
          Close
        </Button>
      </div>
    </ModalShell>
  );
}

function OfficialBotDetail({
  bot,
  imageUrl,
}: {
  bot: OfficialBot;
  imageUrl: string | null | undefined;
}) {
  return (
    <div className="space-y-3 text-sm text-white">
      <div className="flex items-start gap-3">
        {bot.imageKey && imageUrl ? (
          <SignedRemoteImage
            src={imageUrl}
            imageKey={bot.imageKey}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-md object-cover object-top"
          />
        ) : null}
        <div>
          <h3 className="text-base font-semibold text-white">{bot.name}</h3>
          <p className="text-xs text-white/70">
            {bot.accessType === "GAME_MASTER" ? "GM only · " : ""}
            {bot.maxHp} HP · {bot.confCost} CONF
          </p>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm text-white/85">
        {displayText(bot.description)}
      </p>
      <p className="whitespace-pre-wrap text-xs text-white/70">
        Usage: {displayText(bot.usage)}
      </p>
      <p className="whitespace-pre-wrap text-xs text-white/70">
        Notes: {displayText(bot.notes)}
      </p>
    </div>
  );
}
