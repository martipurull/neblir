"use client";

import {
  contentJsonForApi,
  GeneralInformationRichTextJsonField,
} from "@/app/components/character/GeneralInformationRichTextJsonField";
import { GeneralInformationRichTextField } from "@/app/components/character/GeneralInformationRichTextField";
import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { EMPTY_NOTE_DOC } from "@/app/lib/tiptap/characterNote";
import {
  referenceEntryCreateSchema,
  type ReferenceCategory,
} from "@/app/lib/types/reference";
import type { JSONContent } from "@tiptap/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  optionalSuperAdminRichHtml,
  superAdminRichEditorScrollClass,
} from "../_utils/superAdminRichTextEditor";
import {
  parseCreatedCatalogueId,
  superAdminCatalogueCreatedHref,
} from "../_utils/superAdminCatalogueCreated";
import { SuperAdminCatalogueDomainNav } from "./SuperAdminCatalogueDomainNav";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";

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

export function SuperAdminCreateReferenceForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RefFormValues>({
    defaultValues: {
      category: "MECHANICS",
      slug: "",
      title: "",
      summary: "",
      contentJson: EMPTY_NOTE_DOC,
    },
  });

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

    const parsed = referenceEntryCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues.map((i) => i.message).join(". "));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reference-entries", {
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
          "Reference entry was created but the response did not include an id."
        );
        return;
      }
      router.push(superAdminCatalogueCreatedHref("reference", createdId));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SuperAdminSectionShell
      title="Create global reference entry"
      description="MECHANICS and WORLD only (no gameId). Summary and body use TipTap; the body is stored as TipTap JSON in contentJson."
    >
      <SuperAdminCatalogueDomainNav domain="reference" active="create" />

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
              placeholder="combat-actions"
            />
            <p className="mt-2 text-xs text-black/70">
              URL-safe identifier: lowercase letters, numbers, and hyphens only.
              Used in links and must be unique per category. Examples:{" "}
              <code className="rounded bg-black/5 px-1">attack-rolls</code>,{" "}
              <code className="rounded bg-black/5 px-1">world-nebula</code>,{" "}
              <code className="rounded bg-black/5 px-1">skills-overview</code>.
            </p>
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
            <p className="mb-2 text-xs text-black/70">
              Short preview shown in lists. Stored as HTML when non-empty.
            </p>
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
            <p className="mb-2 text-xs text-black/70">
              Main article body. Saved as TipTap JSON (
              <code className="rounded bg-black/5 px-1">contentJson</code>) in
              the database—the same format used when players read reference
              pages.
            </p>
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
            {submitting ? "Creating…" : "Create reference entry"}
          </Button>
        </form>
      </FormProvider>
    </SuperAdminSectionShell>
  );
}
