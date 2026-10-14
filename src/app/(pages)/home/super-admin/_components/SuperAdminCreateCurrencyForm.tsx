"use client";

import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { NumberField } from "@/app/components/shared/NumberField";
import { TextField } from "@/app/components/shared/TextField";
import { currencyCreateSchema } from "@/app/lib/types/currency";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  parseCreatedCatalogueId,
  superAdminCatalogueCreatedHref,
} from "../_utils/superAdminCatalogueCreated";
import { SuperAdminCatalogueDomainNav } from "./SuperAdminCatalogueDomainNav";
import { SuperAdminCatalogueImageBlock } from "./SuperAdminCatalogueImageBlock";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";

type CurrencyFormValues = {
  name: string;
  exchangeValue: string;
  imageKey: string;
};

export function SuperAdminCreateCurrencyForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CurrencyFormValues>({
    defaultValues: { name: "", exchangeValue: "", imageKey: "" },
  });

  const onImageKey = useCallback(
    (key: string) => {
      form.setValue("imageKey", key, { shouldDirty: true });
    },
    [form]
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    const imageKey = values.imageKey.trim();
    if (!imageKey) {
      setErrorMessage(
        "Image is required. Upload a currency image before creating."
      );
      return;
    }

    const payload = {
      name: values.name.trim(),
      exchangeValue: Number(values.exchangeValue),
      imageKey,
    };
    const parsed = currencyCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(
          typeof body?.message === "string"
            ? body.message
            : `Request failed (${res.status})`
        );
        return;
      }
      const createdId = parseCreatedCatalogueId(body);
      if (!createdId) {
        setErrorMessage(
          "Currency was created but the response did not include an id."
        );
        return;
      }
      router.push(superAdminCatalogueCreatedHref("currency", createdId));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SuperAdminSectionShell
      title="Create currency"
      description="A currency needs a unique name, an exchange value in hundredths of one CONF, and an image."
    >
      <SuperAdminCatalogueDomainNav domain="currencies" active="create" />

      <form onSubmit={(event) => void onSubmit(event)} className="mt-4">
        <div className="mb-6">
          <label
            htmlFor="currency-name"
            className="mb-1 block font-bold text-black"
          >
            Name
          </label>
          <TextField
            id="currency-name"
            disabled={submitting}
            {...form.register("name")}
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="currency-exchange-value"
            className="mb-1 block font-bold text-black"
          >
            Exchange value
          </label>
          <p className="mb-2 text-xs text-black/70">
            Whole number of hundredths of one CONF, at least 1. CONF stays 100.
          </p>
          <Controller
            name="exchangeValue"
            control={form.control}
            render={({ field }) => (
              <NumberField
                id="currency-exchange-value"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                min={1}
                step={1}
                disabled={submitting}
                stepperLabel="Exchange value"
              />
            )}
          />
        </div>

        <SuperAdminCatalogueImageBlock
          uploadType="currencies"
          id="currency-image"
          label="Image"
          disabled={submitting}
          onImageKey={onImageKey}
          previewLayout="itemThumbnail"
        />

        {errorMessage ? (
          <InfoCard className="border-neblirDanger bg-paleBlue/20">
            <p className="text-sm text-black">{errorMessage}</p>
          </InfoCard>
        ) : null}

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Creating…" : "Create currency"}
        </Button>
      </form>
    </SuperAdminSectionShell>
  );
}
