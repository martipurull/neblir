"use client";

import { CreateCustomBotModal } from "@/app/components/games/CreateCustomBotModal";
import type { CataloguePromotionSuccess } from "@/lib/api/cataloguePromotions";
import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { TextField } from "@/app/components/shared/TextField";
import type { CustomBotResponse } from "@/app/lib/types/bot";
import { useBrowseCustomTemplates } from "@/hooks/use-browse-custom-templates";
import { fetchGameCustomBots } from "@/lib/api/customBots";
import { useMemo, useState } from "react";

type BrowseCustomBotsModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  onClose: () => void;
  onSuccess?: () => void;
  onPromoted?: (result: CataloguePromotionSuccess) => void;
};

function displayText(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "—";
}

export function BrowseCustomBotsModal(props: BrowseCustomBotsModalProps) {
  if (!props.isOpen) return null;
  return <BrowseCustomBotsModalContent {...props} />;
}

function BrowseCustomBotsModalContent({
  gameId,
  gameName,
  onClose,
  onSuccess,
  onPromoted,
}: BrowseCustomBotsModalProps) {
  const {
    rows: bots,
    loading,
    error,
    selectedId,
    setSelectedId,
    refresh,
  } = useBrowseCustomTemplates(
    gameId,
    fetchGameCustomBots,
    "Failed to load custom bots"
  );
  const [search, setSearch] = useState("");
  const [editCustomBotId, setEditCustomBotId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...bots].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
    if (!query) return sorted;
    return sorted.filter((bot) =>
      [bot.name, bot.description ?? "", bot.usage ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [bots, search]);

  const selected = useMemo(
    () => filtered.find((bot) => bot.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  );

  return (
    <>
      <ModalShell
        isOpen
        concealed={editCustomBotId != null}
        onClose={onClose}
        title={`Browse custom bots — ${gameName}`}
        titleId="browse-custom-bots-title"
        maxWidthClass="max-w-4xl"
      >
        <p className="mt-1 text-xs text-white/70">
          Custom bots for this game. Editing one changes every holding of it.
          Players cannot edit the shared bot.
        </p>
        <div className="mt-3">
          <TextField
            id="browse-custom-bots-search"
            type="search"
            variant="dark"
            density="compact"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search custom bots…"
            aria-label="Search custom bots"
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[17rem_minmax(0,1fr)]">
          <div className="max-h-[55vh] overflow-y-auto rounded border border-white/20 p-2">
            {loading ? (
              <p className="px-2 py-3 text-sm text-white/75">
                Loading custom bots…
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-3 text-sm text-white/75">
                No custom bots yet. Create one from the Bots section.
              </p>
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
              <CustomBotDetail bot={selected} />
            )}
          </div>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-neblirDanger-300">{error}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondaryOutlineXs" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="secondaryOutlineXs"
            disabled={!selected || loading}
            onClick={() => {
              if (selected) setEditCustomBotId(selected.id);
            }}
          >
            Edit
          </Button>
        </div>
      </ModalShell>
      <CreateCustomBotModal
        isOpen={editCustomBotId != null}
        gameId={gameId}
        gameName={gameName}
        editCustomBotId={editCustomBotId}
        onClose={() => setEditCustomBotId(null)}
        onSuccess={() => {
          void refresh().then(() => onSuccess?.());
        }}
        onPromoted={onPromoted}
      />
    </>
  );
}

function CustomBotDetail({ bot }: { bot: CustomBotResponse }) {
  return (
    <div className="space-y-3 text-sm text-white">
      <div>
        <h3 className="text-base font-semibold text-white">{bot.name}</h3>
        <p className="text-xs text-white/70">
          {bot.maxHp} HP
          {bot.confCost != null ? ` · ${bot.confCost} CONF` : ""}
          {bot.maxCargoWeightKg != null
            ? ` · ${bot.maxCargoWeightKg} kg cargo`
            : " · Cargo uncapped"}
          {bot.maxInstalledItems != null
            ? ` · ${bot.maxInstalledItems} installed`
            : " · Installed uncapped"}
          {bot.membersCanModify
            ? " · Members may mint a unique bot"
            : " · Members may not mint"}
        </p>
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
