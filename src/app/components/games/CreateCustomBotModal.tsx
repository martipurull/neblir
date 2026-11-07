"use client";

import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { TextArea } from "@/app/components/shared/TextArea";
import { TextField } from "@/app/components/shared/TextField";
import {
  customBotCreateBodySchema,
  customBotUpdateSchema,
  type CustomBotResponse,
} from "@/app/lib/types/bot";
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
    description: bot.description ?? "",
    usage: bot.usage ?? "",
    notes: bot.notes ?? "",
    membersCanModify: bot.membersCanModify,
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
}: CreateCustomBotModalProps) {
  const isEdit = Boolean(editCustomBotId);
  const [name, setName] = useState("");
  const [maxHp, setMaxHp] = useState("10");
  const [confCost, setConfCost] = useState("");
  const [maxCargoWeightKg, setMaxCargoWeightKg] = useState("");
  const [maxInstalledItems, setMaxInstalledItems] = useState("");
  const [description, setDescription] = useState("");
  const [usage, setUsage] = useState("");
  const [notes, setNotes] = useState("");
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
        setDescription(next.description);
        setUsage(next.usage);
        setNotes(next.notes);
        setMembersCanModify(next.membersCanModify);
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
      description,
      usage,
      notes,
      membersCanModify,
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
        label="Max HP"
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
        min={0}
        required={false}
        placeholder="Optional"
      />
      <ModalNumberField
        id="custom-bot-cargo"
        label="Max cargo kg"
        value={maxCargoWeightKg}
        onChange={setMaxCargoWeightKg}
        disabled={busy}
        min={0}
        step={0.1}
        required={false}
        placeholder="No cap"
        hint="Leave empty for no cargo cap."
      />
      <ModalNumberField
        id="custom-bot-installed"
        label="Max installed items"
        value={maxInstalledItems}
        onChange={setMaxInstalledItems}
        disabled={busy}
        min={0}
        required={false}
        placeholder="No cap"
        hint="Leave empty for no install cap."
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
      <Checkbox
        checked={membersCanModify}
        onChange={setMembersCanModify}
        disabled={busy}
        tone="inverse"
        label="Allow game members to mint a unique bot from this bot"
      />
    </GameFormModal>
  );
}
