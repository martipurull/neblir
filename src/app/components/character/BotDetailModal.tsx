"use client";

import {
  BotDamageProfile,
  botConditionClassName,
  botConditionLabel,
} from "@/app/components/character/BotDamageProfile";
import { CurrentHpAdjustRow } from "@/app/components/character/vehicleDetailModal/VehicleDetailStatRows";
import { Button } from "@/app/components/shared/Button";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { NumberField } from "@/app/components/shared/NumberField";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { TextArea } from "@/app/components/shared/TextArea";
import { TextField } from "@/app/components/shared/TextField";
import type { BotHolding } from "@/app/lib/types/bot";
import { useImageUrls } from "@/hooks/use-image-urls";
import { updateCharacterBotHolding } from "@/lib/api/bots";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useState } from "react";
import type { KeyedMutator } from "swr";
import type { CharacterDetail } from "@/app/lib/types/character";

type BotDetailModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  characterId: string;
  holding: BotHolding | null;
  mutateAction: KeyedMutator<CharacterDetail | null>;
  readOnly?: boolean;
};

export function BotDetailModal(props: BotDetailModalProps) {
  if (!props.isOpen || !props.holding) return null;
  return (
    <BotDetailModalBody
      key={props.holding.id}
      {...props}
      holding={props.holding}
    />
  );
}

function BotDetailModalBody({
  onCloseAction,
  characterId,
  holding,
  mutateAction,
  readOnly = false,
}: BotDetailModalProps & { holding: BotHolding }) {
  const [nickname, setNickname] = useState(holding.customName ?? "");
  const [notes, setNotes] = useState(holding.notes ?? "");
  const [bonus, setBonus] = useState(String(holding.maxHpBonus));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const imageKey = holding.bot?.imageKey ?? null;
  const imageUrls = useImageUrls(
    imageKey ? [{ id: holding.id, imageKey }] : []
  );
  const imageUrl = imageUrls[holding.id];
  const locked = readOnly || busy;

  const save = async (
    body: Parameters<typeof updateCharacterBotHolding>[2],
    fallback: string
  ): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await updateCharacterBotHolding(characterId, holding.id, body);
      await mutateAction();
      return true;
    } catch (saveError) {
      setError(getUserSafeErrorMessage(saveError, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveNickname = () => {
    const next = nickname.trim();
    const current = holding.customName ?? "";
    if (next === current) return;
    void save(
      { action: "setCustomName", customName: next.length > 0 ? next : null },
      "Failed to update nickname"
    );
  };

  const saveNotes = () => {
    const next = notes.trim();
    const current = holding.notes ?? "";
    if (next === current) return;
    void save(
      { action: "setNotes", notes: next.length > 0 ? next : null },
      "Failed to update notes"
    );
  };

  const saveBonus = () => {
    const parsed = Number.parseInt(bonus, 10);
    if (!Number.isFinite(parsed)) {
      setBonus(String(holding.maxHpBonus));
      return;
    }
    if (parsed === holding.maxHpBonus) {
      setBonus(String(holding.maxHpBonus));
      return;
    }
    void save(
      { action: "setMaxHpBonus", maxHpBonus: parsed },
      "Failed to update max HP bonus"
    ).then((saved) => {
      setBonus(saved ? String(parsed) : String(holding.maxHpBonus));
    });
  };

  return (
    <ModalShell
      isOpen
      onClose={onCloseAction}
      title="Bot"
      titleId="bot-detail-modal-title"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4 text-sm text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-white">
                {holding.displayName}
              </h3>
              <span
                className={`text-xs ${botConditionClassName(holding.condition, "dark")}`}
              >
                {botConditionLabel(holding.condition)}
              </span>
            </div>
            {holding.customName && holding.bot?.name ? (
              <p className="mt-1 text-xs text-white/60">{holding.bot.name}</p>
            ) : null}
          </div>
          {imageKey ? (
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
              {imageUrl ? (
                <SignedRemoteImage
                  src={imageUrl}
                  imageKey={imageKey}
                  alt=""
                  width={80}
                  height={80}
                  className="h-20 w-20 object-cover object-center"
                />
              ) : imageUrl === undefined ? (
                <ImageLoadingSkeleton variant="item" />
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <CurrentHpAdjustRow
            currentHp={holding.currentHp}
            maxHp={holding.effectiveMaxHp}
            disabled={locked}
            onAdjust={(amount) => {
              void save(
                {
                  action: "setHp",
                  currentHp: holding.currentHp + amount,
                },
                "Failed to update HP"
              );
            }}
          />
          <div className="rounded-md border border-white/15 bg-white/5 px-3 py-2">
            <div className="text-[11px] uppercase tracking-wider text-white/60">
              Effective max HP
            </div>
            <div className="mt-1 text-sm text-white">
              {holding.effectiveMaxHp ?? "—"}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel id={`bot-nickname-${holding.id}`} label="Nickname" />
            <TextField
              id={`bot-nickname-${holding.id}`}
              variant="dark"
              value={nickname}
              disabled={locked}
              onChange={(event) => setNickname(event.target.value)}
              onBlur={saveNickname}
            />
          </div>
          <div>
            <FieldLabel
              id={`bot-max-hp-bonus-${holding.id}`}
              label="Max HP bonus"
              required
            />
            <NumberField
              id={`bot-max-hp-bonus-${holding.id}`}
              variant="dark"
              value={bonus}
              disabled={locked}
              onChange={setBonus}
              onBlur={saveBonus}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel id={`bot-notes-${holding.id}`} label="Holding notes" />
            <TextArea
              id={`bot-notes-${holding.id}`}
              variant="dark"
              rows={3}
              value={notes}
              disabled={locked}
              onChange={(event) => setNotes(event.target.value)}
              onBlur={saveNotes}
            />
          </div>
        </div>

        {holding.bot?.description ? (
          <PlainBlock label="Description" text={holding.bot.description} />
        ) : null}
        {holding.bot?.usage ? (
          <PlainBlock label="Usage" text={holding.bot.usage} />
        ) : null}
        {holding.bot?.notes ? (
          <PlainBlock label="Template notes" text={holding.bot.notes} />
        ) : null}

        <section className="space-y-2 rounded-md border border-white/10 bg-white/5 p-3">
          <div className="font-medium text-white">Damage profile</div>
          <p className="text-xs text-white/60">
            The same profile on every bot. Rolls are unchanged.
          </p>
          <BotDamageProfile profile={holding.damageProfile} tone="dark" />
        </section>

        {error ? (
          <p className="text-xs text-neblirDanger-300">{error}</p>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="modalPalePrimary"
            fullWidth={false}
            onClick={onCloseAction}
          >
            Close
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function PlainBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-white/60">
        {label}
      </div>
      <p className="mt-1 whitespace-pre-wrap text-white">{text}</p>
    </div>
  );
}
