"use client";

import { AddBotToCharacterModal } from "@/app/components/character/AddBotToCharacterModal";
import { CreateUniqueBotModal } from "@/app/components/games/CreateUniqueBotModal";
import {
  BotDamageProfile,
  botConditionClassName,
  botConditionLabel,
} from "@/app/components/character/BotDamageProfile";
import { BotDetailModal } from "@/app/components/character/BotDetailModal";
import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import { Button } from "@/app/components/shared/Button";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { BotHolding } from "@/app/lib/types/bot";
import { isGiveItemRecipientInGame } from "@/app/lib/gmUtils";
import { useImageUrls } from "@/hooks/use-image-urls";
import { getGameById } from "@/lib/api/game";
import type { KeyedMutator } from "swr";
import { useCallback, useMemo, useState } from "react";

function BotsCountPill({ count }: { count: number }) {
  return (
    <span className="rounded border border-black bg-transparent px-2 py-0.5 text-sm tabular-nums text-black">
      {count}
    </span>
  );
}

function BotsSectionContent({
  character,
  mutate,
  readOnly = false,
  activeGameId = null,
  allowUniqueCreate = false,
  viewerUserId = null,
}: {
  character: CharacterDetail;
  mutate?: KeyedMutator<CharacterDetail | null>;
  readOnly?: boolean;
  activeGameId?: string | null;
  allowUniqueCreate?: boolean;
  viewerUserId?: string | null;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [createUniqueOpen, setCreateUniqueOpen] = useState(false);
  const [editUniqueBotId, setEditUniqueBotId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const holdings = useMemo(
    () =>
      [...(character.bots ?? [])].sort((a, b) =>
        a.displayName.localeCompare(b.displayName, undefined, {
          sensitivity: "base",
        })
      ),
    [character.bots]
  );
  const imageEntries = useMemo(
    () =>
      holdings.map((holding) => ({
        id: holding.id,
        imageKey: holding.bot?.imageKey ?? null,
      })),
    [holdings]
  );
  const imageUrls = useImageUrls(imageEntries);
  const detail = holdings.find((holding) => holding.id === detailId) ?? null;
  const resolveGiveRecipients = useCallback(async () => {
    const gameIds = character.games?.map((entry) => entry.gameId) ?? [];
    if (gameIds.length === 0) return [];
    const games = await Promise.all(gameIds.map((id) => getGameById(id)));
    const byId = new Map<string, string>();
    for (const game of games) {
      if (!game) continue;
      for (const membership of game.characters ?? []) {
        if (!isGiveItemRecipientInGame(membership, game, character.id)) {
          continue;
        }
        const current = membership.character;
        const label = [current.name, current.surname ?? ""]
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
          .join(" ");
        if (!byId.has(current.id)) {
          byId.set(current.id, label.length > 0 ? label : current.id);
        }
      }
    }
    return [...byId.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [character.games, character.id]);

  const activeGameName =
    character.games?.find((entry) => entry.gameId === activeGameId)?.game
      ?.name ?? activeGameId;
  const editHolding =
    holdings.find((holding) => holding.botId === editUniqueBotId) ?? null;

  return (
    <div className="space-y-0">
      {!readOnly && mutate ? (
        <div className="mb-2 flex flex-wrap gap-2 pb-2">
          <Button
            type="button"
            variant="lightToolbarCompact"
            fullWidth={false}
            onClick={() => setAddOpen(true)}
          >
            Add bot
          </Button>
          {allowUniqueCreate ? (
            <Button
              type="button"
              variant="lightToolbarCompact"
              fullWidth={false}
              onClick={() => setCreateUniqueOpen(true)}
              disabled={!activeGameId}
            >
              Mint unique bot
            </Button>
          ) : null}
        </div>
      ) : null}

      {holdings.length === 0 ? (
        <p className="text-sm text-black/65">No bots held.</p>
      ) : (
        <ul className="divide-y divide-black">
          {holdings.map((holding) => (
            <li key={holding.id} className="py-2.5">
              <BotHoldingRow
                holding={holding}
                imageUrl={imageUrls[holding.id]}
                readOnly={readOnly || !mutate}
                onOpen={() => setDetailId(holding.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {mutate ? (
        <AddBotToCharacterModal
          isOpen={addOpen}
          onCloseAction={() => setAddOpen(false)}
          character={character}
          mutateAction={mutate}
        />
      ) : null}
      {mutate && allowUniqueCreate && createUniqueOpen && activeGameId ? (
        <CreateUniqueBotModal
          isOpen
          gameId={activeGameId}
          gameName={activeGameName ?? activeGameId}
          characterId={character.id}
          onClose={() => setCreateUniqueOpen(false)}
          onSuccess={() => {
            void mutate();
          }}
        />
      ) : null}
      {mutate && editUniqueBotId && editHolding?.gameId ? (
        <CreateUniqueBotModal
          isOpen
          gameId={editHolding.gameId}
          gameName={
            character.games?.find(
              (entry) => entry.gameId === editHolding.gameId
            )?.game?.name ?? editHolding.gameId
          }
          editUniqueBotId={editUniqueBotId}
          characterId={character.id}
          onClose={() => setEditUniqueBotId(null)}
          onSuccess={() => {
            void mutate();
          }}
        />
      ) : null}
      {mutate ? (
        <BotDetailModal
          isOpen={detail != null}
          onCloseAction={() => setDetailId(null)}
          onEditUniqueAction={
            !readOnly &&
            detail?.sourceType === "UNIQUE" &&
            detail.uniqueOwnerUserId != null &&
            detail.uniqueOwnerUserId === viewerUserId &&
            detail.gameId
              ? () => {
                  setEditUniqueBotId(detail.botId);
                  setDetailId(null);
                }
              : undefined
          }
          characterId={character.id}
          holding={detail}
          inventory={character.inventory ?? []}
          mutateAction={mutate}
          readOnly={readOnly}
          resolveGiveRecipientsAction={resolveGiveRecipients}
        />
      ) : null}
    </div>
  );
}

function BotHoldingRow({
  holding,
  imageUrl,
  readOnly,
  onOpen,
}: {
  holding: BotHolding;
  imageUrl: string | null | undefined;
  readOnly: boolean;
  onOpen: () => void;
}) {
  const imageKey = holding.bot?.imageKey ?? null;
  const content = (
    <>
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-black/10 bg-paleBlue/30">
        {imageKey && imageUrl ? (
          <SignedRemoteImage
            src={imageUrl}
            imageKey={imageKey}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 object-cover object-center"
          />
        ) : (
          <ImageLoadingSkeleton
            variant="item"
            className="h-full w-full"
            animated={imageKey != null && imageUrl === undefined}
          />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="break-words text-sm text-black">
            {holding.displayName}
          </span>
          <span
            className={`text-xs ${botConditionClassName(holding.condition, "light")}`}
          >
            {botConditionLabel(holding.condition)}
          </span>
        </div>
        <p className="mt-1 text-xs text-black/65">
          {holding.effectiveMaxHp != null
            ? `${holding.currentHp} / ${holding.effectiveMaxHp} HP`
            : `${holding.currentHp} HP`}
        </p>
        <div className="mt-2">
          <BotDamageProfile profile={holding.damageProfile} tone="light" />
        </div>
      </div>
    </>
  );

  if (readOnly) {
    return (
      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-3">
        {content}
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="lightRowHit"
      fullWidth={false}
      className="grid w-full grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-3"
      onClick={onOpen}
    >
      {content}
    </Button>
  );
}

export function getBotsSection(
  character: CharacterDetail,
  options?: {
    mutate?: KeyedMutator<CharacterDetail | null>;
    readOnly?: boolean;
    activeGameId?: string | null;
    allowUniqueCreate?: boolean;
    viewerUserId?: string | null;
  }
): CharacterSectionSlide {
  const count = character.bots?.length ?? 0;
  return {
    id: "bots",
    title: "Bots",
    titleSupplement: <BotsCountPill count={count} />,
    children: (
      <BotsSectionContent
        character={character}
        mutate={options?.mutate}
        readOnly={options?.readOnly === true}
        activeGameId={options?.activeGameId}
        allowUniqueCreate={options?.allowUniqueCreate}
        viewerUserId={options?.viewerUserId}
      />
    ),
  };
}
