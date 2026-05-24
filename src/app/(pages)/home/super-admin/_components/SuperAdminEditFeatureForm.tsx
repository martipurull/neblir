"use client";

import type { PathName } from "@prisma/client";
import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { GeneralInformationRichTextField } from "@/app/components/character/GeneralInformationRichTextField";
import { featureCatalogueUpdateSchema } from "@/app/lib/types/featureCatalogue";
import { serializeEditorToStoredHtml } from "@/app/lib/tiptap/generalInformationRichText";
import { NumberInput } from "@/app/components/shared/NumberInput";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import useSWR from "swr";
import { superAdminRichEditorScrollClass } from "../_utils/superAdminRichTextEditor";
import { SuperAdminCatalogueDomainNav } from "./SuperAdminCatalogueDomainNav";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";
import { PATH_NAME_SELECT_OPTIONS } from "./pathNameSelectOptions";
import { superAdminNavLinkClassName } from "./superAdminNavLinkClass";

type FeatureRow = {
  id: string;
  name: string;
  description: string;
  minPathRank: number;
  maxGrade: number;
  examples?: string[] | null;
  applicablePaths: PathName[];
};

type FeatureFormValues = {
  name: string;
  description: string;
  minPathRank: number;
  maxGrade: number;
  examplesHtml: string;
};

function optionalRichHtml(html: string): string | undefined {
  const t = html.trim();
  if (!t) return undefined;
  const persisted = serializeEditorToStoredHtml(t);
  return persisted || undefined;
}

function examplesFromRichHtml(html: string): string[] {
  const persisted = optionalRichHtml(html);
  return persisted ? [persisted] : [];
}

async function featureFetcher(url: string): Promise<FeatureRow> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as FeatureRow;
}

export function SuperAdminEditFeatureForm({
  featureId,
}: {
  featureId: string;
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<PathName>>(
    () => new Set()
  );

  const { data, error, isLoading, mutate } = useSWR<FeatureRow>(
    featureId ? `/api/features/${featureId}` : null,
    featureFetcher
  );

  const pathValues = useMemo(
    () => PATH_NAME_SELECT_OPTIONS.map((o) => o.value as PathName),
    []
  );

  const form = useForm<FeatureFormValues>({
    defaultValues: {
      name: "",
      description: "",
      minPathRank: 1,
      maxGrade: 3,
      examplesHtml: "",
    },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      name: data.name,
      description: data.description,
      minPathRank: data.minPathRank,
      maxGrade: data.maxGrade,
      examplesHtml: data.examples?.[0] ?? "",
    });
    setSelectedPaths(new Set(data.applicablePaths));
  }, [data, form]);

  const togglePath = (p: PathName, on: boolean) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (on) next.add(p);
      else next.delete(p);
      return next;
    });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    const applicablePaths = [...selectedPaths];
    if (applicablePaths.length === 0) {
      setErrorMessage("Select at least one applicable path.");
      return;
    }

    const descriptionStored = serializeEditorToStoredHtml(
      values.description.trim()
    );
    if (!descriptionStored) {
      setErrorMessage("Description is required.");
      return;
    }

    const payload = {
      name: values.name.trim(),
      description: descriptionStored,
      minPathRank: values.minPathRank,
      maxGrade: values.maxGrade,
      examples: examplesFromRichHtml(values.examplesHtml),
      applicablePaths,
    };

    const parsed = featureCatalogueUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues.map((i) => i.message).join(". "));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/features/${featureId}`, {
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
      router.push("/home/super-admin/features/browse");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SuperAdminSectionShell
      title={data ? `Edit feature: ${data.name}` : "Edit feature"}
      description="Update feature text, rank limits, and applicable paths."
    >
      <SuperAdminCatalogueDomainNav domain="features" active="browse" />

      {isLoading ? (
        <InfoCard className="mb-6">
          <LoadingState text="Loading feature…" />
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
              id="feature-name"
              label="Name"
              register={form.register}
              name="name"
            />

            <div className="mb-6">
              <label
                htmlFor="feature-description"
                className="mb-1 block font-bold text-black"
              >
                Description
              </label>
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <GeneralInformationRichTextField
                    id="feature-description"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    minHeightClass="min-h-28"
                    editorContentClassName={superAdminRichEditorScrollClass}
                  />
                )}
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="feature-examples"
                className="mb-1 block font-bold text-black"
              >
                Examples (optional)
              </label>
              <Controller
                name="examplesHtml"
                control={form.control}
                render={({ field }) => (
                  <GeneralInformationRichTextField
                    id="feature-examples"
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
                name="minPathRank"
                label="Min path rank"
                min={1}
                className="mb-0"
              />
              <NumberInput
                name="maxGrade"
                label="Max grade"
                min={1}
                max={6}
                className="mb-0"
              />
            </div>

            <fieldset className="mb-6">
              <legend className="mb-2 block font-bold text-black">
                Applicable paths
              </legend>
              <div className="flex flex-col gap-2">
                {pathValues.map((p) => (
                  <Checkbox
                    key={p}
                    checked={selectedPaths.has(p)}
                    onChange={(on) => togglePath(p, on)}
                    label={p.replaceAll("_", " ")}
                  />
                ))}
              </div>
            </fieldset>

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
        href="/home/super-admin/features/browse"
        className={`${superAdminNavLinkClassName} mt-6`}
      >
        ← Back to features
      </Link>
    </SuperAdminSectionShell>
  );
}
