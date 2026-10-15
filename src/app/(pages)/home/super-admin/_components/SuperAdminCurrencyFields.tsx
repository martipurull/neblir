"use client";

import { InfoCard } from "@/app/components/shared/InfoCard";
import { NumberInput } from "@/app/components/shared/NumberInput";
import {
  CONF_CURRENCY_NAME,
  CONF_EXCHANGE_VALUE,
} from "@/app/lib/types/currency";
import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { SuperAdminCatalogueImageBlock } from "./SuperAdminCatalogueImageBlock";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";

export type CurrencyFormValues = {
  name: string;
  exchangeValue: number | undefined;
  imageKey: string;
};

export function currencyFormBody(
  values: CurrencyFormValues,
  locked: boolean
): {
  name: string;
  exchangeValue: number | undefined;
  imageKey: string;
} {
  const imageKey = values.imageKey.trim();
  if (locked) {
    return {
      name: CONF_CURRENCY_NAME,
      exchangeValue: CONF_EXCHANGE_VALUE,
      imageKey,
    };
  }
  return {
    name: values.name.trim(),
    exchangeValue: values.exchangeValue,
    imageKey,
  };
}

export function zodIssueSummary(error: {
  issues: { message: string }[];
}): string {
  return error.issues.map((issue) => issue.message).join(". ");
}

export function catalogueRequestErrorMessage(
  body: unknown,
  fallback: string
): string {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }
  return fallback;
}

export function SuperAdminCatalogueFormError({
  message,
}: {
  message: string | null;
}) {
  if (!message) return null;
  return (
    <InfoCard className="border-neblirDanger bg-paleBlue/20">
      <p className="text-sm text-black">{message}</p>
    </InfoCard>
  );
}

export function SuperAdminCurrencyFields({
  locked = false,
  submitting = false,
  exchangeHint,
  initialImageKey = "",
  previewAlt = "Currency",
}: {
  locked?: boolean;
  submitting?: boolean;
  exchangeHint: string;
  initialImageKey?: string;
  previewAlt?: string;
}) {
  const form = useFormContext<CurrencyFormValues>();
  const onImageKey = useCallback(
    (key: string) => {
      form.setValue("imageKey", key, { shouldDirty: true });
    },
    [form]
  );

  return (
    <>
      <SuperAdminLabeledField
        id="currency-name"
        label="Name"
        register={form.register}
        name="name"
        disabled={locked || submitting}
      />

      <div className="mb-6">
        <NumberInput
          name="exchangeValue"
          label="Exchange value"
          min={1}
          step={1}
          parseAs="int"
          allowEmpty
          disabled={locked || submitting}
          className="mb-0"
        />
        <p className="mt-2 text-xs text-black/70">{exchangeHint}</p>
      </div>

      <SuperAdminCatalogueImageBlock
        uploadType="currencies"
        id="currency-image"
        label="Image"
        disabled={submitting}
        initialImageKey={initialImageKey}
        onImageKey={onImageKey}
        previewLayout="itemThumbnail"
        previewAlt={previewAlt}
      />
    </>
  );
}
