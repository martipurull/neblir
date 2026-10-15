"use client";

import { Button } from "@/app/components/shared/Button";
import { currencyCreateSchema } from "@/app/lib/types/currency";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  parseCreatedCatalogueId,
  superAdminCatalogueCreatedHref,
} from "../_utils/superAdminCatalogueCreated";
import { SuperAdminCatalogueDomainNav } from "./SuperAdminCatalogueDomainNav";
import {
  SuperAdminCatalogueFormError,
  SuperAdminCurrencyFields,
  catalogueRequestErrorMessage,
  currencyFormBody,
  zodIssueSummary,
  type CurrencyFormValues,
} from "./SuperAdminCurrencyFields";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";

const exchangeHint =
  "Whole number of hundredths of one CONF, at least 1. CONF stays 100.";

export function SuperAdminCreateCurrencyForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CurrencyFormValues>({
    defaultValues: { name: "", exchangeValue: undefined, imageKey: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    const payload = currencyFormBody(values, false);
    if (!payload.imageKey) {
      setErrorMessage(
        "Image is required. Upload a currency image before creating."
      );
      return;
    }

    const parsed = currencyCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(zodIssueSummary(parsed.error));
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
          catalogueRequestErrorMessage(body, `Request failed (${res.status})`)
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

      <FormProvider {...form}>
        <form onSubmit={(event) => void onSubmit(event)} className="mt-4">
          <SuperAdminCurrencyFields
            submitting={submitting}
            exchangeHint={exchangeHint}
          />

          <SuperAdminCatalogueFormError message={errorMessage} />

          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create currency"}
          </Button>
        </form>
      </FormProvider>
    </SuperAdminSectionShell>
  );
}
