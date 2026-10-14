"use client";

import { Button } from "@/app/components/shared/Button";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import {
  TypeToConfirmDangerModal,
  getDeleteOfficialCatalogueConfirmationPhrase,
} from "@/app/components/shared/TypeToConfirmDangerModal";
import { currencyUpdateSchema, isConfCurrency } from "@/app/lib/types/currency";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import useSWR from "swr";
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

const exchangeHint = "Whole number of hundredths of one CONF, at least 1.";

type CurrencyRow = {
  id: string;
  name: string;
  imageKey: string;
  exchangeValue: number;
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
      exchangeValue: currency.exchangeValue,
      imageKey: currency.imageKey,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    const payload = currencyFormBody(values, locked);
    if (!payload.imageKey) {
      setErrorMessage("Image is required.");
      return;
    }

    const parsed = currencyUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(zodIssueSummary(parsed.error));
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
          catalogueRequestErrorMessage(body, `Request failed (${res.status})`)
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
        catalogueRequestErrorMessage(body, `Delete failed (${res.status})`)
      );
    } finally {
      setDeleting(false);
    }
  }, [currency.id, router]);

  return (
    <FormProvider {...form}>
      <form onSubmit={(event) => void onSubmit(event)} className="mt-4">
        {locked ? (
          <InfoCard className="mb-6">
            <p className="text-sm text-black">
              CONF&apos;s name stays CONF, and its exchange value stays 100. Its
              image can change.
            </p>
          </InfoCard>
        ) : null}

        <SuperAdminCurrencyFields
          locked={locked}
          submitting={submitting}
          exchangeHint={exchangeHint}
          initialImageKey={currency.imageKey}
          previewAlt={currency.name}
        />

        {!confirmOpen ? (
          <SuperAdminCatalogueFormError message={errorMessage} />
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
    </FormProvider>
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
