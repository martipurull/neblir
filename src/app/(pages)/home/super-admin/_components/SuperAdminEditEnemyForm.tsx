"use client";

import { GeneralInformationRichTextField } from "@/app/components/character/GeneralInformationRichTextField";
import { Button } from "@/app/components/shared/Button";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { NumberInput } from "@/app/components/shared/NumberInput";
import { enemyCatalogueUpdateSchema } from "@/app/lib/types/enemy";
import type { EnemyResponse } from "@/app/lib/types/enemy";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import useSWR from "swr";
import {
  optionalSuperAdminRichHtml,
  superAdminRichEditorScrollClass,
} from "../_utils/superAdminRichTextEditor";
import { SuperAdminCatalogueImageBlock } from "./SuperAdminCatalogueImageBlock";
import { SuperAdminCatalogueDomainNav } from "./SuperAdminCatalogueDomainNav";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";
import { superAdminNavLinkClassName } from "./superAdminNavLinkClass";

type EnemyFormValues = {
  name: string;
  description: string;
  imageKey: string;
  health: number;
  speed: number;
  initiativeModifier: number;
  numberOfReactions: number;
  notes: string;
};

async function enemyFetcher(url: string): Promise<EnemyResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as EnemyResponse;
}

export function SuperAdminEditEnemyForm({ enemyId }: { enemyId: string }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<EnemyResponse>(
    enemyId ? `/api/enemies/${enemyId}` : null,
    enemyFetcher
  );

  const form = useForm<EnemyFormValues>({
    defaultValues: {
      name: "",
      description: "",
      imageKey: "",
      health: 10,
      speed: 5,
      initiativeModifier: 0,
      numberOfReactions: 1,
      notes: "",
    },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      name: data.name,
      description: data.description ?? "",
      imageKey: data.imageKey ?? "",
      health: data.health,
      speed: data.speed,
      initiativeModifier: data.initiativeModifier,
      numberOfReactions: data.numberOfReactions,
      notes: data.notes ?? "",
    });
  }, [data, form]);

  const onImageKey = useCallback(
    (key: string) => {
      form.setValue("imageKey", key, { shouldDirty: true });
    },
    [form]
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    const payload = {
      name: values.name.trim(),
      description: optionalSuperAdminRichHtml(values.description),
      imageKey: values.imageKey.trim() || undefined,
      health: values.health,
      speed: values.speed,
      initiativeModifier: values.initiativeModifier,
      numberOfReactions: values.numberOfReactions,
      notes: optionalSuperAdminRichHtml(values.notes),
    };

    const parsed = enemyCatalogueUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues.map((i) => i.message).join(". "));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/enemies/${enemyId}`, {
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
      router.push("/home/super-admin/enemies/browse");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SuperAdminSectionShell
      title={data ? `Edit enemy: ${data.name}` : "Edit enemy"}
      description="Update core stats and rich-text fields. Advanced combat data (actions, resistances) is unchanged unless edited elsewhere."
    >
      <SuperAdminCatalogueDomainNav domain="enemies" active="browse" />

      {isLoading ? (
        <InfoCard className="mb-6">
          <LoadingState text="Loading enemy…" />
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
        <FormProvider {...form}>
          <form onSubmit={(e) => void onSubmit(e)} className="mt-4">
            <SuperAdminLabeledField
              id="enemy-name"
              label="Name"
              register={form.register}
              name="name"
            />

            <SuperAdminCatalogueImageBlock
              key={data.imageKey ?? "no-image"}
              uploadType="custom_enemies"
              id="enemy-image"
              label="Image"
              disabled={submitting}
              initialImageKey={data.imageKey ?? ""}
              onImageKey={onImageKey}
            />

            <div className="mb-6">
              <label
                htmlFor="enemy-description"
                className="mb-1 block font-bold text-black"
              >
                Description (optional)
              </label>
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <GeneralInformationRichTextField
                    id="enemy-description"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    minHeightClass="min-h-24"
                    editorContentClassName={superAdminRichEditorScrollClass}
                  />
                )}
              />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 [&>div]:mb-0">
              <NumberInput
                name="health"
                label="Health"
                min={0}
                className="mb-0"
              />
              <NumberInput
                name="speed"
                label="Speed"
                min={0}
                className="mb-0"
              />
              <NumberInput
                name="initiativeModifier"
                label="Initiative modifier"
                className="mb-0"
              />
              <NumberInput
                name="numberOfReactions"
                label="Number of reactions"
                min={0}
                className="mb-0"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="enemy-notes"
                className="mb-1 block font-bold text-black"
              >
                Notes (optional)
              </label>
              <Controller
                name="notes"
                control={form.control}
                render={({ field }) => (
                  <GeneralInformationRichTextField
                    id="enemy-notes"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    minHeightClass="min-h-24"
                    editorContentClassName={superAdminRichEditorScrollClass}
                  />
                )}
              />
            </div>

            {errorMessage ? (
              <InfoCard className="border-neblirDanger bg-paleBlue/20">
                <p className="text-sm text-black">{errorMessage}</p>
              </InfoCard>
            ) : null}

            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </FormProvider>
      ) : null}

      <Link
        href="/home/super-admin/enemies/browse"
        className={`${superAdminNavLinkClassName} mt-6`}
      >
        ← Back to enemies
      </Link>
    </SuperAdminSectionShell>
  );
}
