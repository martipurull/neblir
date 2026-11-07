"use client";

import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { ModalSelect } from "@/app/components/games/shared/ModalSelect";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { ImageUploadDropzone } from "@/app/components/shared/ImageUploadDropzone";
import { SelectField } from "@/app/components/shared/SelectField";
import { TextArea } from "@/app/components/shared/TextArea";
import { TextField } from "@/app/components/shared/TextField";
import {
  uniqueBotCreateSchema,
  uniqueBotUpdateSchema,
  type BotTemplateSourceType,
} from "@/app/lib/types/bot";
import { fetchGameCustomBots } from "@/lib/api/customBots";
import { getGameOfficialBots } from "@/lib/api/bots";
import {
  createUniqueBot,
  getUniqueBotById,
  mintUniqueBotForCharacter,
  updateUniqueBot,
} from "@/lib/api/uniqueBots";
import { useImageUpload } from "@/hooks/use-image-upload";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useEffect, useState, type FormEvent } from "react";

type CreateUniqueBotModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  /** When set, mint the Unique bot onto this character. */
  characterId?: string;
  editUniqueBotId?: string | null;
  /** GM may mint from a Custom bot that members cannot modify. */
  allowClosedCustom?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type TemplateOption = { id: string; name: string };

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberText(value: number | null | undefined): string {
  return value != null ? String(value) : "";
}

export function CreateUniqueBotModal(props: CreateUniqueBotModalProps) {
  if (!props.isOpen) return null;
  return (
    <CreateUniqueBotModalBody
      key={props.editUniqueBotId ?? props.characterId ?? "create"}
      {...props}
    />
  );
}

function CreateUniqueBotModalBody({
  isOpen,
  gameId,
  gameName,
  characterId,
  editUniqueBotId = null,
  allowClosedCustom = false,
  onClose,
  onSuccess,
}: CreateUniqueBotModalProps) {
  const isEdit = Boolean(editUniqueBotId);
  const [sourceType, setSourceType] =
    useState<BotTemplateSourceType>("STANDALONE");
  const [botId, setBotId] = useState("");
  const [official, setOfficial] = useState<TemplateOption[]>([]);
  const [custom, setCustom] = useState<TemplateOption[]>([]);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [maxHp, setMaxHp] = useState("");
  const [confCost, setConfCost] = useState("");
  const [maxCargoWeightKg, setMaxCargoWeightKg] = useState("");
  const [maxInstalledItems, setMaxInstalledItems] = useState("");
  const [description, setDescription] = useState("");
  const [usage, setUsage] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageUpload = useImageUpload("unique_bots");
  const setImageKey = imageUpload.setImageKey;

  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    void (async () => {
      try {
        const [officialRows, customRows] = await Promise.all([
          getGameOfficialBots(gameId),
          fetchGameCustomBots(gameId),
        ]);
        if (cancelled) return;
        setOfficial(
          officialRows.map((bot) => ({ id: bot.id, name: bot.name }))
        );
        setCustom(
          customRows
            .filter((bot) => allowClosedCustom || bot.membersCanModify)
            .map((bot) => ({ id: bot.id, name: bot.name }))
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(getUserSafeErrorMessage(loadError, "Failed to load bots"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allowClosedCustom, gameId, isEdit]);

  useEffect(() => {
    if (!editUniqueBotId) return;
    let cancelled = false;
    void (async () => {
      try {
        const bot = await getUniqueBotById(editUniqueBotId);
        if (cancelled) return;
        setSourceType(bot.sourceType);
        setBotId(bot.botId ?? "");
        setTemplateName(bot.templateName ?? null);
        setName(bot.nameOverride ?? "");
        setMaxHp(numberText(bot.maxHpOverride));
        setConfCost(numberText(bot.confCostOverride));
        setMaxCargoWeightKg(numberText(bot.maxCargoWeightKgOverride));
        setMaxInstalledItems(numberText(bot.maxInstalledItemsOverride));
        setDescription(bot.descriptionOverride ?? "");
        setUsage(bot.usageOverride ?? "");
        setNotes(bot.notesOverride ?? "");
        if (bot.imageKeyOverride) {
          setImageKey(bot.imageKeyOverride);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            getUserSafeErrorMessage(loadError, "Failed to load unique bot")
          );
        }
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editUniqueBotId, setImageKey]);

  const isStandalone = sourceType === "STANDALONE";
  const templates = sourceType === "OFFICIAL" ? official : custom;
  const busy = submitting || loadingEdit || imageUpload.uploading;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const overrides = {
      nameOverride: optionalText(name),
      imageKeyOverride: optionalText(imageUpload.imageKey),
      descriptionOverride: optionalText(description),
      confCostOverride: optionalNumber(confCost),
      usageOverride: optionalText(usage),
      notesOverride: optionalText(notes),
      maxHpOverride: optionalNumber(maxHp),
      maxCargoWeightKgOverride: optionalNumber(maxCargoWeightKg),
      maxInstalledItemsOverride: optionalNumber(maxInstalledItems),
    };

    if (isEdit && editUniqueBotId) {
      const update = uniqueBotUpdateSchema.safeParse(overrides);
      if (!update.success) {
        setError(update.error.issues.map((issue) => issue.message).join(". "));
        return;
      }
      setSubmitting(true);
      try {
        await updateUniqueBot(editUniqueBotId, update.data);
        onSuccess?.();
        onClose();
      } catch (submitError) {
        setError(
          getUserSafeErrorMessage(submitError, "Failed to update unique bot")
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const create = uniqueBotCreateSchema.safeParse({
      gameId,
      sourceType,
      ...(isStandalone ? {} : { botId }),
      ...overrides,
    });
    if (!create.success) {
      setError(create.error.issues.map((issue) => issue.message).join(". "));
      return;
    }

    setSubmitting(true);
    try {
      if (characterId) {
        await mintUniqueBotForCharacter(characterId, create.data);
      } else {
        await createUniqueBot(create.data);
      }
      onSuccess?.();
      onClose();
    } catch (submitError) {
      setError(
        getUserSafeErrorMessage(submitError, "Failed to mint unique bot")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const nameLabel = isStandalone ? "Name" : "Name override";
  const maxHpLabel = isStandalone ? "Max HP" : "Max HP override";

  return (
    <GameFormModal
      isOpen={isOpen}
      title={isEdit ? "Edit unique bot" : "Mint unique bot"}
      subtitle={gameName}
      titleId="unique-bot-form-title"
      error={error}
      onClose={onClose}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      submitting={submitting}
      submitDisabled={busy}
      submitLabel={isEdit ? "Save bot" : "Mint bot"}
    >
      {isEdit && templateName ? (
        <p className="text-sm text-white/80">Based on {templateName}.</p>
      ) : null}
      {!isEdit ? (
        <div>
          <FieldLabel id="unique-bot-source" label="Source" required />
          <SelectField
            id="unique-bot-source"
            variant="dark"
            value={sourceType}
            disabled={busy}
            options={[
              { value: "STANDALONE", label: "Standalone" },
              { value: "OFFICIAL", label: "Official bot" },
              { value: "CUSTOM", label: "Custom bot" },
            ]}
            onChange={(value) => {
              setSourceType(value);
              setBotId("");
            }}
          />
        </div>
      ) : null}
      {!isEdit && !isStandalone ? (
        <ModalSelect
          id="unique-bot-template"
          label={sourceType === "OFFICIAL" ? "Official bot" : "Custom bot"}
          placeholder={
            templates.length === 0 ? "No bots available" : "Select a bot"
          }
          value={botId}
          options={templates.map((bot) => ({ value: bot.id, label: bot.name }))}
          disabled={busy || templates.length === 0}
          onChange={setBotId}
        />
      ) : null}
      <div>
        <FieldLabel
          id="unique-bot-name"
          label={nameLabel}
          required={isStandalone}
        />
        <TextField
          id="unique-bot-name"
          type="text"
          variant="dark"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required={isStandalone}
          disabled={busy}
        />
      </div>
      <ModalNumberField
        id="unique-bot-max-hp"
        label={maxHpLabel}
        value={maxHp}
        onChange={setMaxHp}
        disabled={busy}
        required={isStandalone}
        min={1}
        step={1}
      />
      <ModalNumberField
        id="unique-bot-conf"
        label="CONF cost"
        value={confCost}
        onChange={setConfCost}
        disabled={busy}
        required={false}
        step={1}
      />
      <ModalNumberField
        id="unique-bot-cargo"
        label="Max cargo kg"
        value={maxCargoWeightKg}
        onChange={setMaxCargoWeightKg}
        disabled={busy}
        required={false}
        min={0}
        step={1}
      />
      <ModalNumberField
        id="unique-bot-installed"
        label="Max installed items"
        value={maxInstalledItems}
        onChange={setMaxInstalledItems}
        disabled={busy}
        required={false}
        min={0}
        step={1}
      />
      <div>
        <FieldLabel id="unique-bot-description" label="Description" />
        <TextArea
          id="unique-bot-description"
          variant="dark"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={busy}
        />
      </div>
      <div>
        <FieldLabel id="unique-bot-usage" label="Usage" />
        <TextArea
          id="unique-bot-usage"
          variant="dark"
          value={usage}
          onChange={(event) => setUsage(event.target.value)}
          disabled={busy}
        />
      </div>
      <div>
        <FieldLabel id="unique-bot-notes" label="Notes" />
        <TextArea
          id="unique-bot-notes"
          variant="dark"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={busy}
        />
      </div>
      <ImageUploadDropzone
        id="unique-bot-image"
        label={isStandalone ? "Image" : "Image override"}
        imageKey={imageUpload.imageKey}
        onFileChange={(file) => {
          void imageUpload.handleFile(file);
        }}
        onDrop={imageUpload.handleDrop}
        onDragOver={imageUpload.handleDragOver}
        uploading={imageUpload.uploading}
        error={imageUpload.uploadError}
        disabled={busy}
        previewLayout="itemThumbnail"
        previewImageAlt={
          name.trim().length > 0 ? `${name.trim()} image` : "Bot image"
        }
      />
    </GameFormModal>
  );
}
