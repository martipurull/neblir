"use client";

import {
  contentJsonForApi,
  GeneralInformationRichTextJsonField,
} from "@/app/components/character/GeneralInformationRichTextJsonField";
import { GeneralInformationRichTextField } from "@/app/components/character/GeneralInformationRichTextField";
import { Button } from "@/app/components/shared/Button";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { EMPTY_NOTE_DOC } from "@/app/lib/tiptap/characterNote";
import {
  referenceEntryUpdateSchema,
  type ReferenceCategory,
  type ReferenceEntry,
} from "@/app/lib/types/reference";
import type { JSONContent } from "@tiptap/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import useSWR from "swr";
import {
  optionalSuperAdminRichHtml,
  superAdminRichEditorScrollClass,
} from "../_utils/superAdminRichTextEditor";
import SuperAdminCatalogueDomainNav from "./SuperAdminCatalogueDomainNav";
import SuperAdminSectionShell from "./SuperAdminSectionShell";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";
import { superAdminNavLinkClassName } from "./superAdminNavLinkClass";

type RefFormValues = {
  category: ReferenceCategory;
  slug: string;
  title: string;
  summary: string;
  contentJson: JSONContent;
};

const categoryOptions = [
  { value: "MECHANICS", label: "Mechanics" },
  { value: "WORLD", label: "World" },
];

async function referenceFetcher(url: string): Promise<ReferenceEntry> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as ReferenceEntry;
}

export default function SuperAdminEditReferenceForm({
  entryId,
}: {
  entryId: string;
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<ReferenceEntry>(
    entryId ? `/api/reference-entries/${entryId}` : null,
    referenceFetcher
  );

  const form = useForm<RefFormValues>({
    defaultValues: {
      category: "MECHANICS",
      slug: "",
      title: "",
      summary: "",
      contentJson: EMPTY_NOTE_DOC,
    },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      category:
        data.category === "WORLD"
          ? "WORLD"
          : ("MECHANICS" as ReferenceCategory),
      slug: data.slug,
      title: data.title,
      summary: data.summary ?? "",
      contentJson: (data.contentJson as JSONContent | null) ?? EMPTY_NOTE_DOC,
    });
  }, [data, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);

    const payload = {
      category: values.category,
      slug: values.slug.trim(),
      title: values.title.trim(),
      summary: optionalSuperAdminRichHtml(values.summary) ?? null,
      contentJson: contentJsonForApi(values.contentJson),
      gameId: null,
    };

    const parsed = referenceEntryUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues.map((i) => i.message).join(". "));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/reference-entries/${entryId}`, {
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
      router.push("/home/super-admin/reference/browse");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SuperAdminSectionShell
      title={data ? `Edit reference: ${data.title}` : "Edit reference entry"}
      description="Update global mechanics or world reference content."
    >
      <SuperAdminCatalogueDomainNav domain="reference" active="browse" />

      {isLoading ? (
        <InfoCard className="mb-6">
          <LoadingState text="Loading reference entry…" />
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
            <div className="mb-6">
              <SelectDropdown
                id="ref-category"
                label="Category"
                placeholder="Category"
                value={form.watch("category")}
                options={categoryOptions}
                onChange={(v) =>
                  form.setValue("category", v as ReferenceCategory, {
                    shouldValidate: true,
                  })
                }
              />
            </div>

            <div className="mb-6">
              <SuperAdminLabeledField
                id="ref-slug"
                label="Slug"
                register={form.register}
                name="slug"
              />
            </div>

            <SuperAdminLabeledField
              id="ref-title"
              label="Title"
              register={form.register}
              name="title"
            />

            <div className="mb-6">
              <label
                htmlFor="ref-summary"
                className="mb-1 block font-bold text-black"
              >
                Summary (optional)
              </label>
              <Controller
                name="summary"
                control={form.control}
                render={({ field }) => (
                  <GeneralInformationRichTextField
                    id="ref-summary"
                    value={field.value}
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
                htmlFor="ref-content"
                className="mb-1 block font-bold text-black"
              >
                Content
              </label>
              <Controller
                name="contentJson"
                control={form.control}
                render={({ field }) => (
                  <GeneralInformationRichTextJsonField
                    id="ref-content"
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
        </FormProvider>
      ) : null}

      <Link
        href="/home/super-admin/reference/browse"
        className={`${superAdminNavLinkClassName} mt-6`}
      >
        ← Back to reference entries
      </Link>
    </SuperAdminSectionShell>
  );
}
