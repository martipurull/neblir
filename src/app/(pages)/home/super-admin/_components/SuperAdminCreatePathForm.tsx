"use client";

import Button from "@/app/components/shared/Button";
import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { GeneralInformationRichTextField } from "@/app/components/character/GeneralInformationRichTextField";
import type { Path } from "@/app/lib/types/path";
import { pathCreateSchema, type PathCreate } from "@/app/lib/types/path";
import { serializeEditorToStoredHtml } from "@/app/lib/tiptap/generalInformationRichText";
import type { PathName } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import useSWR from "swr";
import {
  parseCreatedCatalogueId,
  superAdminCatalogueCreatedHref,
} from "../_utils/superAdminCatalogueCreated";
import { superAdminRichEditorScrollClass } from "../_utils/superAdminRichTextEditor";
import SuperAdminCatalogueDomainNav from "./SuperAdminCatalogueDomainNav";
import SuperAdminSectionShell from "./SuperAdminSectionShell";
import { buildAvailablePathNameSelectOptions } from "./pathNameSelectOptions";

async function pathsFetcher(url: string): Promise<Path[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as Path[];
}

function optionalRichHtml(html: string): string | undefined {
  const t = html.trim();
  if (!t) return undefined;
  const persisted = serializeEditorToStoredHtml(t);
  return persisted || undefined;
}

export default function SuperAdminCreatePathForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    data: existingPaths,
    error: pathsError,
    isLoading: pathsLoading,
    mutate: refreshPaths,
  } = useSWR<Path[]>("/api/paths", pathsFetcher);

  const usedNames = useMemo(
    () => new Set((existingPaths ?? []).map((p) => p.name as PathName)),
    [existingPaths]
  );

  const availableNameOptions = useMemo(
    () => buildAvailablePathNameSelectOptions(usedNames),
    [usedNames]
  );

  const form = useForm<PathCreate>({
    defaultValues: {
      name: "" as PathCreate["name"],
      description: "",
      baseFeature: "",
    },
  });

  useEffect(() => {
    if (availableNameOptions.length === 0) return;
    const current = form.getValues("name");
    if (!availableNameOptions.some((o) => o.value === current)) {
      form.setValue(
        "name",
        availableNameOptions[0].value as PathCreate["name"],
        {
          shouldValidate: true,
        }
      );
    }
  }, [availableNameOptions, form]);

  const canCreate =
    availableNameOptions.length > 0 && !pathsLoading && !pathsError;

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);

    if (!availableNameOptions.some((o) => o.value === values.name)) {
      setErrorMessage(
        "That path name already exists in the catalogue. Choose another name or refresh the list."
      );
      return;
    }

    const baseFeatureStored = serializeEditorToStoredHtml(
      values.baseFeature.trim()
    );
    if (!baseFeatureStored) {
      setErrorMessage("Base feature is required.");
      return;
    }

    const payload: PathCreate = {
      name: values.name,
      baseFeature: baseFeatureStored,
      description: optionalRichHtml(values.description ?? "") ?? null,
    };

    const parsed = pathCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues.map((i) => i.message).join(". "));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/paths", {
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
        if (res.status === 409) {
          await refreshPaths();
        }
        return;
      }
      const createdId = parseCreatedCatalogueId(body);
      if (!createdId) {
        setErrorMessage(
          "Path was created but the response did not include an id."
        );
        return;
      }
      router.push(superAdminCatalogueCreatedHref("path", createdId));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SuperAdminSectionShell
      title="Create path"
      description="Only PathName enum values without a catalogue row are listed. Add a new enum member in Prisma first, then create its path here."
    >
      <SuperAdminCatalogueDomainNav domain="paths" active="create" />

      {pathsLoading ? (
        <InfoCard className="mb-6">
          <LoadingState text="Loading existing paths…" />
        </InfoCard>
      ) : null}

      {pathsError ? (
        <InfoCard className="mb-6">
          <ErrorState
            message={
              pathsError instanceof Error ? pathsError.message : "Load failed"
            }
            onRetry={() => void refreshPaths()}
            retryLabel="Retry"
          />
        </InfoCard>
      ) : null}

      {!pathsLoading && !pathsError && availableNameOptions.length === 0 ? (
        <InfoCard className="mb-6 border-neblirWarning bg-paleBlue/20">
          <p className="text-sm text-black">
            Every PathName enum value already has a path in the database. To add
            another path, extend the PathName enum in Prisma, run{" "}
            <code className="rounded bg-black/5 px-1">prisma db push</code>,
            then return here.
          </p>
        </InfoCard>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} className="mt-4">
        <div className="mb-6">
          <SelectDropdown
            id="path-name"
            label="Path name (enum)"
            placeholder={
              canCreate ? "Select path" : "No unused enum names available"
            }
            value={form.watch("name")}
            options={availableNameOptions}
            disabled={!canCreate}
            onChange={(v) =>
              form.setValue("name", v as PathCreate["name"], {
                shouldValidate: true,
              })
            }
          />
          {canCreate ? (
            <p className="mt-2 text-xs text-black/65">
              {availableNameOptions.length} unused enum{" "}
              {availableNameOptions.length === 1 ? "name" : "names"} available.
            </p>
          ) : null}
        </div>

        <fieldset disabled={!canCreate} className="min-w-0 border-0 p-0">
          <div className="mb-6">
            <label
              htmlFor="path-description"
              className="mb-1 block font-bold text-black"
            >
              Description (optional)
            </label>
            <p className="mb-2 text-xs text-black/70">
              Rich text is stored as HTML (same editor as character backstory).
            </p>
            <Controller
              name="description"
              control={form.control}
              defaultValue=""
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
            <p className="mb-2 text-xs text-black/70">
              Required. Use lists or emphasis if the rules text needs structure.
            </p>
            <Controller
              name="baseFeature"
              control={form.control}
              defaultValue=""
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

          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !canCreate}
          >
            {submitting ? "Creating…" : "Create path"}
          </Button>
        </fieldset>
      </form>
    </SuperAdminSectionShell>
  );
}
