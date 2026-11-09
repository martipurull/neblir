"use client";

import {
  BotActionListEditor,
  BotActionOverrideEditor,
} from "@/app/components/character/BotActionListEditor";
import { DarkBotCombatFields } from "@/app/components/games/DarkBotCombatFields";
import { DarkBotTrackFields } from "@/app/components/games/DarkBotTrackFields";
import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { ImageUploadDropzone } from "@/app/components/shared/ImageUploadDropzone";
import {
  SelectDropdown,
  type SelectDropdownOption,
} from "@/app/components/shared/SelectDropdown";
import { TextArea } from "@/app/components/shared/TextArea";
import { TextField } from "@/app/components/shared/TextField";
import {
  combatFieldTextFromOverrides,
  combatOverridesFromFieldText,
  emptyCombatFieldText,
} from "@/app/lib/botCombat";
import {
  emptyTrackFieldText,
  trackFieldTextFromOverrides,
  trackOverridesFromFieldText,
} from "@/app/lib/botTracks";
import {
  uniqueBotCreateSchema,
  uniqueBotUpdateSchema,
  type BotTemplateSourceType,
} from "@/app/lib/types/bot";
import type { BotAction } from "@/app/lib/types/botAction";
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

const UNIQUE_BOT_SOURCE_OPTIONS: SelectDropdownOption<BotTemplateSourceType>[] =
  [
    { value: "STANDALONE", label: "Standalone" },
    { value: "OFFICIAL", label: "Official bot" },
    { value: "CUSTOM", label: "Custom bot" },
  ];

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
  const [speed, setSpeed] = useState("");
  const [maxCarryWeight, setMaxCarryWeight] = useState("");
  const [heightMetres, setHeightMetres] = useState("");
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");
  const [usage, setUsage] = useState("");
  const [notes, setNotes] = useState("");
  const [actions, setActions] = useState<BotAction[] | null>([]);
  const [additionalActions, setAdditionalActions] = useState<
    BotAction[] | null
  >([]);
  const [tracks, setTracks] = useState(emptyTrackFieldText);
  const [combat, setCombat] = useState(emptyCombatFieldText);
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
        setSpeed(numberText(bot.speedOverride));
        setMaxCarryWeight(numberText(bot.maxCarryWeightOverride));
        setHeightMetres(numberText(bot.heightMetresOverride));
        setWeight(numberText(bot.weightOverride));
        setDescription(bot.descriptionOverride ?? "");
        setUsage(bot.usageOverride ?? "");
        setNotes(bot.notesOverride ?? "");
        setActions(
          bot.sourceType === "STANDALONE"
            ? (bot.actionsOverride ?? [])
            : (bot.actionsOverride ?? null)
        );
        setAdditionalActions(
          bot.sourceType === "STANDALONE"
            ? (bot.additionalActionsOverride ?? [])
            : (bot.additionalActionsOverride ?? null)
        );
        setTracks(trackFieldTextFromOverrides(bot));
        setCombat(combatFieldTextFromOverrides(bot));
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
      speedOverride: optionalNumber(speed),
      maxCarryWeightOverride: optionalNumber(maxCarryWeight),
      heightMetresOverride: optionalNumber(heightMetres),
      weightOverride: optionalNumber(weight),
      ...trackOverridesFromFieldText(tracks),
      ...combatOverridesFromFieldText(combat),
      actionsOverride: isStandalone ? (actions ?? []) : actions,
      additionalActionsOverride: isStandalone
        ? (additionalActions ?? [])
        : additionalActions,
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
        getUserSafeErrorMessage(submitError, "Failed to create unique bot")
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
      title={isEdit ? "Edit unique bot" : "Create unique bot"}
      subtitle={gameName}
      titleId="unique-bot-form-title"
      error={error}
      onClose={onClose}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      submitting={submitting}
      submitDisabled={busy}
      submitLabel={isEdit ? "Save bot" : "Create unique bot"}
    >
      {isEdit && templateName ? (
        <p className="text-sm text-white/80">Based on {templateName}.</p>
      ) : null}
      {!isEdit ? (
        <SelectDropdown
          id="unique-bot-source"
          label="Source"
          surface="modal"
          required
          placeholder="Select a source"
          value={sourceType}
          sortOptions={false}
          disabled={busy}
          options={UNIQUE_BOT_SOURCE_OPTIONS}
          onChange={(value) => {
            setSourceType(value);
            setBotId("");
            if (value === "STANDALONE") {
              setActions((current) => current ?? []);
              setAdditionalActions((current) => current ?? []);
            } else {
              setActions(null);
              setAdditionalActions(null);
            }
          }}
        />
      ) : null}
      {!isEdit && !isStandalone ? (
        <SelectDropdown
          id="unique-bot-template"
          label={sourceType === "OFFICIAL" ? "Official bot" : "Custom bot"}
          surface="modal"
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
        id="unique-bot-speed"
        label={isStandalone ? "Speed (m)" : "Speed override (m)"}
        value={speed}
        onChange={setSpeed}
        disabled={busy}
        required={false}
        min={0}
        step={1}
      />
      <ModalNumberField
        id="unique-bot-max-carry"
        label={isStandalone ? "Max carry (kg)" : "Max carry override (kg)"}
        value={maxCarryWeight}
        onChange={setMaxCarryWeight}
        disabled={busy}
        required={false}
        min={0}
        step={0.1}
      />
      <ModalNumberField
        id="unique-bot-height"
        label={isStandalone ? "Height (m)" : "Height override (m)"}
        value={heightMetres}
        onChange={setHeightMetres}
        disabled={busy}
        required={false}
        min={0}
        step={0.1}
      />
      <ModalNumberField
        id="unique-bot-weight"
        label={isStandalone ? "Weight (kg)" : "Weight override (kg)"}
        value={weight}
        onChange={setWeight}
        disabled={busy}
        required={false}
        min={0}
        step={0.1}
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
      <p className="text-xs text-white/65">
        {isStandalone
          ? "Blank bases use 0. Blank battery capacity uses 1. Blank attacks and defences use 1. Blank Reactions use 2."
          : "Leave a value blank to keep the template value."}
      </p>
      {isStandalone ? (
        <>
          <BotActionListEditor
            idPrefix="unique-bot-actions"
            title="Bot actions"
            value={actions ?? []}
            disabled={busy}
            onChange={setActions}
          />
          <BotActionListEditor
            idPrefix="unique-bot-additional-actions"
            title="Bot additional actions"
            value={additionalActions ?? []}
            disabled={busy}
            onChange={setAdditionalActions}
          />
        </>
      ) : (
        <>
          <BotActionOverrideEditor
            idPrefix="unique-bot-actions"
            title="bot actions"
            value={actions}
            disabled={busy}
            onChange={setActions}
          />
          <BotActionOverrideEditor
            idPrefix="unique-bot-additional-actions"
            title="bot additional actions"
            value={additionalActions}
            disabled={busy}
            onChange={setAdditionalActions}
          />
        </>
      )}
      <DarkBotTrackFields
        idPrefix="unique-bot"
        values={tracks}
        disabled={busy}
        required={false}
        labelFor={(label) => (isStandalone ? label : `${label} override`)}
        onChange={(key, value) =>
          setTracks((current) => ({ ...current, [key]: value }))
        }
      />
      <DarkBotCombatFields
        idPrefix="unique-bot"
        values={combat}
        disabled={busy}
        required={false}
        labelFor={(label) => (isStandalone ? label : `${label} override`)}
        onChange={(key, value) =>
          setCombat((current) => ({ ...current, [key]: value }))
        }
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
        previewLayout="sheetPortrait"
        previewImageAlt={
          name.trim().length > 0 ? `${name.trim()} image` : "Bot image"
        }
      />
    </GameFormModal>
  );
}
