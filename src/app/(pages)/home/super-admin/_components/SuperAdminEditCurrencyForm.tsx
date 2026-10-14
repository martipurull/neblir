"use client";

import { Button } from "@/app/components/shared/Button";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { NumberField } from "@/app/components/shared/NumberField";
import { TextField } from "@/app/components/shared/TextField";
import {
  TypeToConfirmDangerModal,
  getDeleteOfficialCatalogueConfirmationPhrase,
} from "@/app/components/shared/TypeToConfirmDangerModal";
import {
  CONF_CURRENCY_NAME,
  CONF_EXCHANGE_VALUE,
  currencyUpdateSchema,
  isConfCurrency,
} from "@/app/lib/types/currency";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import useSWR from "swr";
import { SuperAdminCatalogueDomainNav } from "./SuperAdminCatalogueDomainNav";
import { SuperAdminCatalogueImageBlock } from "./SuperAdminCatalogueImageBlock";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";

type CurrencyRow = {
  id: string;
  name: string;
  imageKey: string;
  exchangeValue: number;
};

type CurrencyFormValues = {
  name: string;
  exchangeValue: string;
  imageKey: string;
};

async function currencyFetcher(url: string): Promise<CurrencyRow> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as CurrencyRow;
}

function CurrencyEditFields({ currency }: { currency: CurrencyRow }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const locked = isConfCurrency(currency.name);

  const form = useForm<CurrencyFormValues>({
    defaultValues: {
      name: currency.name,
      exchangeValue: String(currency.exchangeValue),
      imageKey: currency.imageKey,
    },
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
      setErrorMessage("Image is required.");
      return;
    }

    const payload = locked
      ? {
          name: CONF_CURRENCY_NAME,
          exchangeValue: CONF_EXCHANGE_VALUE,
          imageKey,
        }
      : {
          name: values.name.trim(),
          exchangeValue: Number(values.exchangeValue),
          imageKey,
        };
    const parsed = currencyUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/currencies/${currency.id}`, {
        method: "PATCH",
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
      router.push("/home/super-admin/currencies/browse");
    } finally {
      setSubmitting(false);
    }
  });

  const handleDelete = useCallback(async () => {
    setErrorMessage(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/currencies/${currency.id}`, {
        method: "DELETE",
      });
      if (res.status === 204) {
        router.push("/home/super-admin/currencies/browse");
        return;
      }
      const body = await res.json().catch(() => ({}));
      setErrorMessage(
        typeof body?.message === "string"
          ? body.message
          : `Delete failed (${res.status})`
      );
    } finally {
      setDeleting(false);
    }
  }, [currency.id, router]);

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mt-4">
      {locked ? (
        <InfoCard className="mb-6">
          <p className="text-sm text-black">
            CONF&apos;s name stays CONF, and its exchange value stays 100. Its
            image can change.
          </p>
        </InfoCard>
      ) : null}

      <div className="mb-6">
        <label
          htmlFor="currency-name"
          className="mb-1 block font-bold text-black"
        >
          Name
        </label>
        <TextField
          id="currency-name"
          disabled={locked || submitting}
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
          Whole number of hundredths of one CONF, at least 1.
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
              disabled={locked || submitting}
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
        initialImageKey={currency.imageKey}
        onImageKey={onImageKey}
        previewLayout="itemThumbnail"
        previewAlt={currency.name}
      />

      {errorMessage && !confirmOpen ? (
        <InfoCard className="border-neblirDanger bg-paleBlue/20">
          <p className="text-sm text-black">{errorMessage}</p>
        </InfoCard>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        <Button
          type="submit"
          variant="primary"
          disabled={submitting || deleting}
        >
          {submitting ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={submitting || deleting}
          onClick={() => {
            setErrorMessage(null);
            setConfirmOpen(true);
          }}
        >
          {deleting ? "Deleting…" : "Delete currency"}
        </Button>
      </div>

      <TypeToConfirmDangerModal
        isOpen={confirmOpen}
        title="Delete this currency from the catalogue?"
        description={<p>This removes the currency from the catalogue.</p>}
        requiredPhrase={getDeleteOfficialCatalogueConfirmationPhrase(
          currency.name
        )}
        confirmLabel="Delete currency"
        cancelLabel="Cancel"
        isSubmitting={deleting}
        errorMessage={errorMessage}
        onCancel={() => {
          if (deleting) return;
          setConfirmOpen(false);
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </form>
  );
}

export function SuperAdminEditCurrencyForm({
  currencyId,
}: {
  currencyId: string;
}) {
  const { data, error, isLoading, mutate } = useSWR<CurrencyRow>(
    currencyId ? `/api/currencies/${currencyId}` : null,
    currencyFetcher
  );

  return (
    <SuperAdminSectionShell
      title={data ? `Edit currency: ${data.name}` : "Edit currency"}
      description="Update the name, exchange value, or image."
    >
      <SuperAdminCatalogueDomainNav domain="currencies" active="browse" />

      {isLoading ? (
        <InfoCard className="mb-6">
          <LoadingState text="Loading currency…" />
        </InfoCard>
      ) : null}

      {error ? (
        <InfoCard className="mb-6">
          <ErrorState
            message={error instanceof Error ? error.message : "Load failed"}
            onRetry={() => void mutate()}
            retryLabel="Retry"
          />
        </InfoCard>
      ) : null}

      {data ? (
        <CurrencyEditFields
          key={`${data.id}:${data.name}:${data.exchangeValue}:${data.imageKey}`}
          currency={data}
        />
      ) : null}
    </SuperAdminSectionShell>
  );
}
