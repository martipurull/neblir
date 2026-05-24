"use client";

import { Button } from "@/app/components/shared/Button";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { GeneralInformationRichTextField } from "@/app/components/character/GeneralInformationRichTextField";
import type { Path } from "@/app/lib/types/path";
import {
  pathCatalogueUpdateSchema,
  type PathCreate,
} from "@/app/lib/types/path";
import { serializeEditorToStoredHtml } from "@/app/lib/tiptap/generalInformationRichText";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import useSWR from "swr";
import { superAdminRichEditorScrollClass } from "../_utils/superAdminRichTextEditor";
import { SuperAdminCatalogueDomainNav } from "./SuperAdminCatalogueDomainNav";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";
import { superAdminNavLinkClassName } from "./superAdminNavLinkClass";

async function pathFetcher(url: string): Promise<Path> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as Path;
}

function optionalRichHtml(html: string): string | undefined {
  const t = html.trim();
  if (!t) return undefined;
  const persisted = serializeEditorToStoredHtml(t);
  return persisted || undefined;
}

export function SuperAdminEditPathForm({ pathId }: { pathId: string }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<Path>(
    pathId ? `/api/paths/${pathId}` : null,
    pathFetcher
  );

  const form = useForm<PathCreate>({
    defaultValues: {
      name: "" as PathCreate["name"],
      description: "",
      baseFeature: "",
    },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      name: data.name,
      description: data.description ?? "",
      baseFeature: data.baseFeature,
    });
  }, [data, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);

    const baseFeatureStored = serializeEditorToStoredHtml(
      values.baseFeature.trim()
    );
    if (!baseFeatureStored) {
      setErrorMessage("Base feature is required.");
      return;
    }

    const payload = {
      description: optionalRichHtml(values.description ?? "") ?? null,
      baseFeature: baseFeatureStored,
    };

    const parsed = pathCatalogueUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues.map((i) => i.message).join(". "));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/paths/${pathId}`, {
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
      router.push("/home/super-admin/paths/browse");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SuperAdminSectionShell
      title={data ? `Edit path: ${String(data.name)}` : "Edit path"}
      description="Path name (enum) cannot be changed here. Update description and base feature text."
    >
      <SuperAdminCatalogueDomainNav domain="paths" active="browse" />

      {isLoading ? (
        <InfoCard className="mb-6">
          <LoadingState text="Loading path…" />
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
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4">
          <p className="mb-6 text-sm text-black/75">
            <span className="font-semibold text-black">Path name:</span>{" "}
            {String(data.name)}
          </p>

          <div className="mb-6">
            <label
              htmlFor="path-description"
              className="mb-1 block font-bold text-black"
            >
              Description (optional)
            </label>
            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <GeneralInformationRichTextField
                  id="path-description"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  minHeightClass="min-h-24"
                  editorContentClassName={superAdminRichEditorScrollClass}
                />
              )}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="path-base-feature"
              className="mb-1 block font-bold text-black"
            >
              Base feature
            </label>
            <Controller
              name="baseFeature"
              control={form.control}
              render={({ field }) => (
                <GeneralInformationRichTextField
                  id="path-base-feature"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  minHeightClass="min-h-28"
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
      ) : null}

      <Link
        href="/home/super-admin/paths/browse"
        className={`${superAdminNavLinkClassName} mt-6`}
      >
        ← Back to paths
      </Link>
    </SuperAdminSectionShell>
  );
}
