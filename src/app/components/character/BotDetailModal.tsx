"use client";

import {
  BotDamageProfile,
  botConditionClassName,
  botConditionLabel,
} from "@/app/components/character/BotDamageProfile";
import { CurrentHpAdjustRow } from "@/app/components/character/vehicleDetailModal/VehicleDetailStatRows";
import { Button } from "@/app/components/shared/Button";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import type { SelectDropdownOption } from "@/app/components/shared/SelectDropdown";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { NumberField } from "@/app/components/shared/NumberField";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { TextArea } from "@/app/components/shared/TextArea";
import { TextField } from "@/app/components/shared/TextField";
import { BotActionsSection } from "@/app/components/character/BotActionsSection";
import { BotAttributeRollModal } from "@/app/components/character/BotAttributeRollModal";
import { BotCombatRollModal } from "@/app/components/character/BotCombatRollModal";
import { BotCombatSection } from "@/app/components/character/BotCombatSection";
import { BotInitiativeRollModal } from "@/app/components/character/BotInitiativeRollModal";
import { BotHoldingTracksSection } from "@/app/components/character/BotHoldingTracksSection";
import type { BotAttributeRoll } from "@/app/lib/botAttributeRoll";
import type { BotCombatValue } from "@/app/lib/botCombat";
import type { RollPrivacyOptions } from "@/app/lib/roll-privacy";
import { BotPlacementSection } from "@/app/components/character/BotPlacementSection";
import { BotSpeedReadout } from "@/app/components/character/BotSpeedReadout";
import { formatWeightKgForDisplay } from "@/app/lib/carryWeightUtils";
import { DangerConfirmModal } from "@/app/components/shared/DangerConfirmModal";
import type { BotHolding } from "@/app/lib/types/bot";
import { useImageUrls } from "@/hooks/use-image-urls";
import {
  removeCharacterBotHolding,
  transferCharacterBotHolding,
  updateCharacterBotHolding,
} from "@/lib/api/bots";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useEffect, useState } from "react";
import type { KeyedMutator } from "swr";
import type { CharacterDetail, ItemCharacter } from "@/app/lib/types/character";

type BotDetailModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  characterId: string;
  holding: BotHolding | null;
  inventory: ItemCharacter[];
  mutateAction: KeyedMutator<CharacterDetail | null>;
  readOnly?: boolean;
  gameId?: string | null;
  rollPrivacy?: RollPrivacyOptions;
  resolveGiveRecipientsAction?: () => Promise<SelectDropdownOption[]>;
  onEditUniqueAction?: () => void;
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
  inventory,
  mutateAction,
  readOnly = false,
  gameId = null,
  rollPrivacy = { allowPrivateRoll: false, defaultPrivateRoll: false },
  resolveGiveRecipientsAction,
  onEditUniqueAction,
}: BotDetailModalProps & { holding: BotHolding }) {
  const [nickname, setNickname] = useState(holding.customName ?? "");
  const [notes, setNotes] = useState(holding.notes ?? "");
  const [bonus, setBonus] = useState(String(holding.maxHpBonus));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [rollingAttribute, setRollingAttribute] =
    useState<BotAttributeRoll | null>(null);
  const [rollingCombat, setRollingCombat] = useState<BotCombatValue | null>(
    null
  );
  const [initiativeOpen, setInitiativeOpen] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [recipients, setRecipients] = useState<SelectDropdownOption[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const imageKey = holding.bot?.imageKey ?? null;
  const imageUrls = useImageUrls(
    imageKey ? [{ id: holding.id, imageKey }] : []
  );
  const imageUrl = imageUrls[holding.id];
  const locked = readOnly || busy;

  useEffect(() => {
    if (readOnly || !resolveGiveRecipientsAction) return;
    let cancelled = false;
    setRecipientsLoading(true);
    void resolveGiveRecipientsAction()
      .then((options) => {
        if (!cancelled) setRecipients(options);
      })
      .catch(() => {
        if (!cancelled) setRecipients([]);
      })
      .finally(() => {
        if (!cancelled) setRecipientsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [readOnly, resolveGiveRecipientsAction]);

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

  const canRoll = !readOnly && gameId != null && gameId.length > 0;

  return (
    <>
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
            <div className="rounded-md border border-white/15 bg-white/5 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wider text-white/60">
                Speed
              </div>
              <div className="mt-1 text-sm">
                <BotSpeedReadout
                  speed={holding.speed}
                  effectiveSpeed={holding.effectiveSpeed}
                  strikethrough={holding.speedStrikethrough}
                  tone="dark"
                />
              </div>
            </div>
            <div className="rounded-md border border-white/15 bg-white/5 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wider text-white/60">
                Carry
              </div>
              <div className="mt-1 text-sm text-white">
                {formatWeightKgForDisplay(holding.carriedWeightKg)} /{" "}
                {formatWeightKgForDisplay(
                  holding.effectiveMaxCarryWeight ?? holding.maxCarryWeight
                )}{" "}
                kg
              </div>
            </div>
            <div className="rounded-md border border-white/15 bg-white/5 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wider text-white/60">
                Height
              </div>
              <div className="mt-1 text-sm text-white">
                {holding.heightMetres != null
                  ? `${formatWeightKgForDisplay(holding.heightMetres)} m`
                  : "—"}
              </div>
            </div>
            <div className="rounded-md border border-white/15 bg-white/5 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wider text-white/60">
                Weight
              </div>
              <div className="mt-1 text-sm text-white">
                {holding.weight != null
                  ? `${formatWeightKgForDisplay(holding.weight)} kg`
                  : "—"}
              </div>
            </div>
          </div>

          {canRoll ? (
            <Button
              type="button"
              variant="semanticWarningOutline"
              fullWidth={false}
              disabled={!holding.mayRoll}
              onClick={() => setInitiativeOpen(true)}
            >
              Roll initiative
            </Button>
          ) : null}

          <BotHoldingTracksSection
            holding={holding}
            locked={locked}
            canRoll={canRoll}
            onRollAttribute={setRollingAttribute}
            onSave={save}
          />

          <BotCombatSection
            holding={holding}
            inventory={inventory}
            canRoll={canRoll}
            onRoll={setRollingCombat}
          />

          <BotActionsSection
            holding={holding}
            canRoll={canRoll}
            characterId={characterId}
            gameId={gameId}
            rollPrivacy={rollPrivacy}
          />

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
              <FieldLabel
                id={`bot-notes-${holding.id}`}
                label="Holding notes"
              />
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

          <BotPlacementSection
            characterId={characterId}
            holding={holding}
            inventory={inventory}
            readOnly={readOnly}
            onChanged={() => mutateAction()}
          />

          <section className="space-y-2 rounded-md border border-white/10 bg-white/5 p-3">
            <div className="font-medium text-white">Damage profile</div>
            <p className="text-xs text-white/60">
              The same profile on every bot. Rolls are unchanged.
            </p>
            <BotDamageProfile profile={holding.damageProfile} tone="dark" />
          </section>

          {!readOnly && resolveGiveRecipientsAction ? (
            <section className="space-y-2 rounded-md border border-white/10 bg-white/5 p-3">
              <div>
                <div className="font-medium text-white">Give bot</div>
                <p className="text-xs text-white/65">
                  Return installed, cargo, and carried items before giving this
                  bot to another character.
                </p>
              </div>
              <SelectDropdown
                id={`bot-give-recipient-${holding.id}`}
                label="Give to"
                showLabel={false}
                placeholder={
                  recipientsLoading
                    ? "Loading characters…"
                    : "Choose a character"
                }
                value={recipientId}
                options={recipients}
                disabled={
                  locked || recipientsLoading || recipients.length === 0
                }
                onChange={setRecipientId}
              />
              <Button
                type="button"
                variant="modalPaleOutline"
                fullWidth={false}
                disabled={locked || recipientId.length === 0}
                onClick={() => {
                  void giveBot();
                }}
              >
                Give bot
              </Button>
            </section>
          ) : null}

          {error ? (
            <p className="text-xs text-neblirDanger-300">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            {onEditUniqueAction ? (
              <Button
                type="button"
                variant="modalPaleOutline"
                fullWidth={false}
                disabled={locked}
                onClick={onEditUniqueAction}
              >
                Edit unique bot
              </Button>
            ) : null}
            {!readOnly ? (
              <Button
                type="button"
                variant="danger"
                fullWidth={false}
                disabled={locked}
                onClick={() => setRemoveOpen(true)}
              >
                Remove bot
              </Button>
            ) : null}
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
        <DangerConfirmModal
          isOpen={removeOpen}
          variant="modalBackground"
          title="Remove bot"
          description="Return installed, cargo, and carried items to this character first. An empty holding can be removed."
          confirmLabel="Remove bot"
          isSubmitting={busy}
          errorMessage={removeOpen ? error : null}
          onCancel={() => {
            if (busy) return;
            setRemoveOpen(false);
          }}
          onConfirm={() => {
            void saveRemoval();
          }}
        />
      </ModalShell>
      {initiativeOpen && gameId != null && gameId.length > 0 ? (
        <BotInitiativeRollModal
          key={holding.id}
          holding={holding}
          characterId={characterId}
          gameId={gameId}
          rollPrivacy={rollPrivacy}
          onClose={() => setInitiativeOpen(false)}
        />
      ) : null}
      {rollingAttribute != null && gameId != null && gameId.length > 0 ? (
        <BotAttributeRollModal
          key={`${holding.id}-${rollingAttribute}`}
          holding={holding}
          attribute={rollingAttribute}
          characterId={characterId}
          gameId={gameId}
          rollPrivacy={rollPrivacy}
          onClose={() => setRollingAttribute(null)}
        />
      ) : null}
      {rollingCombat != null && gameId != null && gameId.length > 0 ? (
        <BotCombatRollModal
          key={`${holding.id}-${rollingCombat}`}
          holding={holding}
          combat={rollingCombat}
          inventory={inventory}
          characterId={characterId}
          gameId={gameId}
          rollPrivacy={rollPrivacy}
          onClose={() => setRollingCombat(null)}
          onRolled={() => {
            void mutateAction();
          }}
        />
      ) : null}
    </>
  );

  async function giveBot() {
    if (recipientId.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await transferCharacterBotHolding(characterId, holding.id, recipientId);
      await mutateAction();
      onCloseAction();
    } catch (giveError) {
      setError(getUserSafeErrorMessage(giveError, "Failed to give bot"));
    } finally {
      setBusy(false);
    }
  }

  async function saveRemoval() {
    setBusy(true);
    setError(null);
    try {
      await removeCharacterBotHolding(characterId, holding.id);
      setRemoveOpen(false);
      await mutateAction();
      onCloseAction();
    } catch (removeError) {
      setError(getUserSafeErrorMessage(removeError, "Failed to remove bot"));
    } finally {
      setBusy(false);
    }
  }
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
