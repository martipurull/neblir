"use client";

import { Button } from "@/app/components/shared/Button";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { NumberInput } from "@/app/components/shared/NumberInput";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import {
  botSchema,
  botUpdateSchema,
  type BotAccessType,
  type OfficialBot,
} from "@/app/lib/types/bot";
import { getCatalogueBot } from "@/lib/api/bots";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import useSWR from "swr";
import {
  parseCreatedCatalogueId,
  superAdminCatalogueCreatedHref,
} from "../_utils/superAdminCatalogueCreated";
import { SuperAdminCatalogueDomainNav } from "./SuperAdminCatalogueDomainNav";
import { SuperAdminCatalogueImageBlock } from "./SuperAdminCatalogueImageBlock";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";

type BotFormValues = {
  accessType: BotAccessType;
  name: string;
  imageKey: string;
  description: string;
  confCost: number;
  usage: string;
  notes: string;
  maxHp: number;
  maxCargoWeightKg?: number;
  maxInstalledItems?: number;
};

const accessOptions = [
  { value: "PLAYER", label: "Player" },
  { value: "GAME_MASTER", label: "Game master" },
];

function createDefaults(): BotFormValues {
  return {
    accessType: "PLAYER",
    name: "",
    imageKey: "",
    description: "",
    confCost: 0,
    usage: "",
    notes: "",
    maxHp: 1,
    maxCargoWeightKg: undefined,
    maxInstalledItems: undefined,
  };
}

function botToFormValues(bot: OfficialBot): BotFormValues {
  return {
    accessType: bot.accessType,
    name: bot.name,
    imageKey: bot.imageKey ?? "",
    description: bot.description,
    confCost: bot.confCost,
    usage: bot.usage ?? "",
    notes: bot.notes ?? "",
    maxHp: bot.maxHp,
    maxCargoWeightKg: bot.maxCargoWeightKg ?? undefined,
    maxInstalledItems: bot.maxInstalledItems ?? undefined,
  };
}

function optionalPlainText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function SuperAdminBotForm({
  editBotId,
}: {
  editBotId?: string;
} = {}) {
  const isEdit = Boolean(editBotId?.trim());
  const { data, error, isLoading } = useSWR<OfficialBot>(
    isEdit && editBotId ? `/api/bots/${editBotId}` : null,
    () => getCatalogueBot(editBotId ?? "")
  );

  if (isEdit && isLoading) {
    return (
      <SuperAdminSectionShell
        title="Edit bot"
        description="Update the official bot catalogue entry."
      >
        <SuperAdminCatalogueDomainNav domain="bots" active="browse" />
        <InfoCard className="mb-6">
          <LoadingState text="Loading bot…" />
        </InfoCard>
      </SuperAdminSectionShell>
    );
  }

  return (
    <SuperAdminBotFormFields
      key={data?.id ?? "create"}
      editBotId={editBotId}
      data={data ?? null}
      loadError={error}
    />
  );
}

function SuperAdminBotFormFields({
  editBotId,
  data,
  loadError: error,
}: {
  editBotId?: string;
  data: OfficialBot | null;
  loadError: unknown;
}) {
  const router = useRouter();
  const isEdit = Boolean(editBotId?.trim());
  const initialValues = data ? botToFormValues(data) : createDefaults();
  const imageKeyRef = useRef(initialValues.imageKey);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BotFormValues>({
    defaultValues: initialValues,
  });
  const watchedName = useWatch({ control: form.control, name: "name" });

  const onImageKey = useCallback(
    (key: string) => {
      imageKeyRef.current = key;
      form.setValue("imageKey", key, { shouldDirty: true });
    },
    [form]
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus(null);
    const payload = {
      accessType: values.accessType,
      name: values.name.trim(),
      imageKey: optionalPlainText(imageKeyRef.current),
      description: values.description.trim(),
      confCost: values.confCost,
      usage: optionalPlainText(values.usage),
      notes: optionalPlainText(values.notes),
      maxHp: values.maxHp,
      maxCargoWeightKg: values.maxCargoWeightKg ?? null,
      maxInstalledItems: values.maxInstalledItems ?? null,
    };
    const parsed = (isEdit ? botUpdateSchema : botSchema).safeParse(payload);
    if (!parsed.success) {
      setStatus(parsed.error.issues.map((issue) => issue.message).join(". "));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/bots/${editBotId}` : "/api/bots", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(
          typeof body?.message === "string"
            ? body.message
            : `Request failed (${res.status})`
        );
        return;
      }
      if (isEdit) {
        router.push("/home/super-admin/bots/browse");
        return;
      }
      const createdId = parseCreatedCatalogueId(body);
      if (!createdId) {
        setStatus("Bot was created but the response did not include an id.");
        return;
      }
      router.push(superAdminCatalogueCreatedHref("bot", createdId));
    } finally {
      setSubmitting(false);
    }
  });

  const trimmedWatchedName =
    typeof watchedName === "string" && watchedName.trim() !== ""
      ? watchedName.trim()
      : undefined;
  const previewAlt = trimmedWatchedName ?? data?.name ?? "Bot";

  return (
    <SuperAdminSectionShell
      title={
        isEdit
          ? data
            ? `Edit bot: ${data.name}`
            : "Edit bot"
          : "Create official bot"
      }
      description={
        isEdit
          ? "Update the official bot catalogue entry."
          : "Create a published bot template. A character holds the bot; the character is not an Owner of it."
      }
    >
      <SuperAdminCatalogueDomainNav
        domain="bots"
        active={isEdit ? "browse" : "create"}
      />

      {error ? (
        <InfoCard className="mb-6">
          <ErrorState
            message={error instanceof Error ? error.message : "Load failed"}
          />
        </InfoCard>
      ) : null}

      {!isEdit || data ? (
        <FormProvider {...form}>
          <form onSubmit={(event) => void onSubmit(event)} className="mt-4">
            <div className="mb-6">
              <SelectDropdown
                id="bot-access"
                label="Access"
                placeholder="Access"
                value={form.watch("accessType")}
                options={accessOptions}
                onChange={(value) =>
                  form.setValue("accessType", value as BotAccessType, {
                    shouldValidate: true,
                  })
                }
              />
            </div>

            <SuperAdminLabeledField
              id="bot-name"
              label="Name"
              register={form.register}
              name="name"
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <NumberInput
                name="confCost"
                label="Cost (CONF)"
                className="mb-0"
              />
              <NumberInput
                name="maxHp"
                label="Max HP"
                min={1}
                className="mb-0"
              />
              <NumberInput
                name="maxCargoWeightKg"
                label="Cargo max (kg, empty = no cap)"
                min={0}
                step="any"
                parseAs="float"
                allowEmpty
                className="mb-0"
              />
              <NumberInput
                name="maxInstalledItems"
                label="Installed max (empty = no cap)"
                min={0}
                parseAs="int"
                allowEmpty
                className="mb-0"
              />
            </div>

            <SuperAdminCatalogueImageBlock
              key={form.watch("imageKey") || "bot-image"}
              uploadType="bots"
              id="official-bot-image"
              label="Bot image (optional)"
              disabled={submitting}
              initialImageKey={form.watch("imageKey")}
              onImageKey={onImageKey}
              previewLayout="itemThumbnail"
              previewAlt={previewAlt}
            />

            <SuperAdminLabeledField
              id="bot-description"
              label="Description"
              register={form.register}
              name="description"
              rows={4}
            />
            <SuperAdminLabeledField
              id="bot-usage"
              label="Usage (optional)"
              register={form.register}
              name="usage"
              rows={3}
            />
            <SuperAdminLabeledField
              id="bot-notes"
              label="Notes (optional)"
              register={form.register}
              name="notes"
              rows={3}
            />

            {status ? (
              <InfoCard className="border-neblirDanger bg-paleBlue/20">
                <p className="text-sm text-black">{status}</p>
              </InfoCard>
            ) : null}

            <div className="mt-6">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting
                  ? isEdit
                    ? "Saving…"
                    : "Creating…"
                  : isEdit
                    ? "Save changes"
                    : "Create bot"}
              </Button>
            </div>
          </form>
        </FormProvider>
      ) : null}
    </SuperAdminSectionShell>
  );
}
