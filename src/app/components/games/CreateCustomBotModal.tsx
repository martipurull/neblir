"use client";

import { BotActionListEditor } from "@/app/components/character/BotActionListEditor";
import { DarkBotCombatFields } from "@/app/components/games/DarkBotCombatFields";
import { DarkBotTrackFields } from "@/app/components/games/DarkBotTrackFields";
import { PromoteCustomTemplateSection } from "@/app/components/games/PromoteCustomTemplateSection";
import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { TextArea } from "@/app/components/shared/TextArea";
import { TextField } from "@/app/components/shared/TextField";
import { botOpenEndedStatLabel } from "@/app/lib/botFieldLabels";
import {
  combatFieldTextFromStats,
  combatStatsFromFieldText,
  defaultCombatFieldText,
} from "@/app/lib/botCombat";
import {
  defaultTrackFieldText,
  trackFieldTextFromStats,
  trackStatsFromFieldText,
} from "@/app/lib/botTracks";
import {
  customBotCreateBodySchema,
  customBotUpdateSchema,
  type CustomBotResponse,
} from "@/app/lib/types/bot";
import type { BotAction } from "@/app/lib/types/botAction";
import type { CataloguePromotionSuccess } from "@/lib/api/cataloguePromotions";
import {
  createGameCustomBot,
  getGameCustomBot,
  updateGameCustomBot,
} from "@/lib/api/customBots";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useEffect, useState, type FormEvent } from "react";

type CreateCustomBotModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  editCustomBotId?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
  onPromoted?: (result: CataloguePromotionSuccess) => void;
};

function optionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return Number(trimmed);
}

function optionalNumberText(value: number | null | undefined): string {
  return value != null ? String(value) : "";
}

function formFromBot(bot: CustomBotResponse) {
  return {
    name: bot.name,
    maxHp: String(bot.maxHp),
    confCost: optionalNumberText(bot.confCost),
    maxCargoWeightKg: optionalNumberText(bot.maxCargoWeightKg),
    maxInstalledItems: optionalNumberText(bot.maxInstalledItems),
    speed: String(bot.speed ?? 0),
    maxCarryWeight: String(bot.maxCarryWeight ?? 0),
    heightMetres: optionalNumberText(bot.heightMetres),
    weight: optionalNumberText(bot.weight),
    description: bot.description ?? "",
    usage: bot.usage ?? "",
    notes: bot.notes ?? "",
    membersCanModify: bot.membersCanModify,
    actions: bot.actions,
    additionalActions: bot.additionalActions,
  };
}

export function CreateCustomBotModal(props: CreateCustomBotModalProps) {
  if (!props.isOpen) return null;
  return (
    <CreateCustomBotModalBody
      key={props.editCustomBotId ?? "create"}
      {...props}
    />
  );
}

function CreateCustomBotModalBody({
  isOpen,
  gameId,
  gameName,
  editCustomBotId = null,
  onClose,
  onSuccess,
  onPromoted,
}: CreateCustomBotModalProps) {
  const isEdit = Boolean(editCustomBotId);
  const [name, setName] = useState("");
  const [maxHp, setMaxHp] = useState("10");
  const [confCost, setConfCost] = useState("");
  const [maxCargoWeightKg, setMaxCargoWeightKg] = useState("");
  const [maxInstalledItems, setMaxInstalledItems] = useState("");
  const [speed, setSpeed] = useState("0");
  const [maxCarryWeight, setMaxCarryWeight] = useState("0");
  const [heightMetres, setHeightMetres] = useState("");
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");
  const [usage, setUsage] = useState("");
  const [notes, setNotes] = useState("");
  const [actions, setActions] = useState<BotAction[]>([]);
  const [additionalActions, setAdditionalActions] = useState<BotAction[]>([]);
  const [tracks, setTracks] = useState(defaultTrackFieldText);
  const [combat, setCombat] = useState(defaultCombatFieldText);
  const [membersCanModify, setMembersCanModify] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editCustomBotId) return;
    let cancelled = false;
    void (async () => {
      try {
        const bot = await getGameCustomBot(gameId, editCustomBotId);
        if (cancelled) return;
        const next = formFromBot(bot);
        setName(next.name);
        setMaxHp(next.maxHp);
        setConfCost(next.confCost);
        setMaxCargoWeightKg(next.maxCargoWeightKg);
        setMaxInstalledItems(next.maxInstalledItems);
        setSpeed(next.speed);
        setMaxCarryWeight(next.maxCarryWeight);
        setHeightMetres(next.heightMetres);
        setWeight(next.weight);
        setDescription(next.description);
        setUsage(next.usage);
        setNotes(next.notes);
        setActions(next.actions);
        setAdditionalActions(next.additionalActions);
        setMembersCanModify(next.membersCanModify);
        setTracks(trackFieldTextFromStats(bot));
        setCombat(combatFieldTextFromStats(bot));
      } catch (loadError) {
        if (!cancelled) {
          setError(
            getUserSafeErrorMessage(loadError, "Failed to load custom bot")
          );
        }
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editCustomBotId, gameId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const payload = {
      name,
      maxHp: Number(maxHp),
      confCost: optionalNumber(confCost),
      maxCargoWeightKg: optionalNumber(maxCargoWeightKg),
      maxInstalledItems: optionalNumber(maxInstalledItems),
      speed: Number(speed),
      maxCarryWeight: Number(maxCarryWeight),
      heightMetres: optionalNumber(heightMetres),
      weight: optionalNumber(weight),
      description,
      usage,
      notes,
      membersCanModify,
      actions,
      additionalActions,
      ...trackStatsFromFieldText(tracks),
      ...combatStatsFromFieldText(combat),
    };
    if (isEdit && editCustomBotId) {
      const update = customBotUpdateSchema.safeParse(payload);
      if (!update.success) {
        setError(update.error.issues.map((issue) => issue.message).join(". "));
        return;
      }
      setSubmitting(true);
      try {
        await updateGameCustomBot(gameId, editCustomBotId, update.data);
        onSuccess?.();
        onClose();
      } catch (submitError) {
        setError(
          getUserSafeErrorMessage(submitError, "Failed to update custom bot")
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const create = customBotCreateBodySchema.safeParse(payload);
    if (!create.success) {
      setError(create.error.issues.map((issue) => issue.message).join(". "));
      return;
    }

    setSubmitting(true);
    try {
      await createGameCustomBot(gameId, create.data);
      onSuccess?.();
      onClose();
    } catch (submitError) {
      setError(
        getUserSafeErrorMessage(submitError, "Failed to create custom bot")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || loadingEdit;

  return (
    <GameFormModal
      isOpen={isOpen}
      title={isEdit ? "Edit custom bot" : "Create custom bot"}
      subtitle={gameName}
      titleId="custom-bot-form-title"
      error={error}
      onClose={onClose}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      submitting={submitting}
      submitDisabled={busy}
      submitLabel={isEdit ? "Save bot" : "Create bot"}
    >
      <div>
        <FieldLabel id="custom-bot-name" label="Name" required />
        <TextField
          id="custom-bot-name"
          type="text"
          variant="dark"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          disabled={busy}
        />
      </div>
      <ModalNumberField
        id="custom-bot-max-hp"
        label={botOpenEndedStatLabel("maxHp")}
        value={maxHp}
        onChange={setMaxHp}
        disabled={busy}
        min={1}
        required
      />
      <ModalNumberField
        id="custom-bot-conf-cost"
        label="Conf cost"
        value={confCost}
        onChange={setConfCost}
        disabled={busy}
        required={false}
        placeholder="Optional"
      />
      <ModalNumberField
        id="custom-bot-speed"
        label={botOpenEndedStatLabel("speed")}
        value={speed}
        onChange={setSpeed}
        disabled={busy}
        min={0}
        required
      />
      <ModalNumberField
        id="custom-bot-max-carry"
        label={botOpenEndedStatLabel("maxCarry")}
        value={maxCarryWeight}
        onChange={setMaxCarryWeight}
        disabled={busy}
        min={0}
        step={0.1}
        required
      />
      <ModalNumberField
        id="custom-bot-height"
        label={botOpenEndedStatLabel("height")}
        value={heightMetres}
        onChange={setHeightMetres}
        disabled={busy}
        min={0}
        step={0.1}
        required={false}
        placeholder="Descriptive"
        hint="Shown on the sheet. It does not encumber the character."
      />
      <ModalNumberField
        id="custom-bot-weight"
        label={botOpenEndedStatLabel("weight")}
        value={weight}
        onChange={setWeight}
        disabled={busy}
        min={0}
        step={0.1}
        required={false}
        placeholder="Descriptive"
        hint="The bot's own weight. It does not encumber the character."
      />
      <ModalNumberField
        id="custom-bot-cargo"
        label={botOpenEndedStatLabel("cargo")}
        value={maxCargoWeightKg}
        onChange={setMaxCargoWeightKg}
        disabled={busy}
        min={0}
        step={0.1}
        required={false}
        placeholder="No cap"
      />
      <ModalNumberField
        id="custom-bot-installed"
        label={botOpenEndedStatLabel("installed")}
        value={maxInstalledItems}
        onChange={setMaxInstalledItems}
        disabled={busy}
        min={0}
        required={false}
        placeholder="No cap"
      />
      <div>
        <FieldLabel id="custom-bot-description" label="Description" />
        <TextArea
          id="custom-bot-description"
          variant="dark"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={busy}
        />
      </div>
      <div>
        <FieldLabel id="custom-bot-usage" label="Usage" />
        <TextArea
          id="custom-bot-usage"
          variant="dark"
          rows={3}
          value={usage}
          onChange={(event) => setUsage(event.target.value)}
          disabled={busy}
        />
      </div>
      <div>
        <FieldLabel id="custom-bot-notes" label="Notes" />
        <TextArea
          id="custom-bot-notes"
          variant="dark"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={busy}
        />
      </div>
      <BotActionListEditor
        idPrefix="custom-bot-actions"
        title="Bot actions"
        value={actions}
        disabled={busy}
        onChange={setActions}
      />
      <BotActionListEditor
        idPrefix="custom-bot-additional-actions"
        title="Bot additional actions"
        value={additionalActions}
        disabled={busy}
        onChange={setAdditionalActions}
      />
      <DarkBotTrackFields
        idPrefix="custom-bot"
        values={tracks}
        disabled={busy}
        required
        labelFor={(label) => label}
        onChange={(key, value) =>
          setTracks((current) => ({ ...current, [key]: value }))
        }
      />
      <DarkBotCombatFields
        idPrefix="custom-bot"
        values={combat}
        disabled={busy}
        required
        labelFor={(label) => label}
        onChange={(key, value) =>
          setCombat((current) => ({ ...current, [key]: value }))
        }
      />
      <Checkbox
        checked={membersCanModify}
        onChange={setMembersCanModify}
        disabled={busy}
        tone="inverse"
        label="Allow game members to mint a unique bot from this bot"
      />
      {isEdit && editCustomBotId ? (
        <PromoteCustomTemplateSection
          key={editCustomBotId}
          gameId={gameId}
          customId={editCustomBotId}
          catalogueDomain="bots"
          disabled={busy}
          onPromoted={onPromoted}
        />
      ) : null}
    </GameFormModal>
  );
}
