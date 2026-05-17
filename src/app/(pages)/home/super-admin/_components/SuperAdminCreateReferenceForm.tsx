"use client";

import Button from "@/app/components/shared/Button";
import InfoCard from "@/app/components/shared/InfoCard";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import {
  referenceEntryCreateSchema,
  type ReferenceCategory,
} from "@/app/lib/types/reference";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  parseCreatedCatalogueId,
  superAdminCatalogueCreatedHref,
} from "../_utils/superAdminCatalogueCreated";
import SuperAdminSectionShell from "./SuperAdminSectionShell";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";

const DEFAULT_DOC = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Replace this body with valid TipTap JSON." },
      ],
    },
  ],
};

type RefFormValues = {
  category: ReferenceCategory;
  slug: string;
  title: string;
  summary: string;
  contentJson: string;
};

const categoryOptions = [
  { value: "MECHANICS", label: "Mechanics" },
  { value: "WORLD", label: "World" },
];

export default function SuperAdminCreateReferenceForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const defaultJson = useMemo(() => JSON.stringify(DEFAULT_DOC, null, 2), []);

  const form = useForm<RefFormValues>({
    defaultValues: {
      category: "MECHANICS",
      slug: "",
      title: "",
      summary: "",
      contentJson: defaultJson,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    let contentJson: unknown;
    try {
      contentJson = JSON.parse(values.contentJson) as unknown;
    } catch {
      setErrorMessage("contentJson must be valid JSON.");
      return;
    }

    const payload = {
      category: values.category,
      slug: values.slug.trim(),
      title: values.title.trim(),
      summary: values.summary.trim() || null,
      contentJson,
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
      description="MECHANICS and WORLD only (no gameId). Paste TipTap-compatible JSON for contentJson."
    >
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
        <SuperAdminLabeledField
          id="ref-slug"
          label="Slug (URL-safe)"
          register={form.register}
          name="slug"
        />
        <SuperAdminLabeledField
          id="ref-title"
          label="Title"
          register={form.register}
          name="title"
        />
        <SuperAdminLabeledField
          id="ref-summary"
          label="Summary (optional)"
          register={form.register}
          name="summary"
          rows={2}
        />
        <SuperAdminLabeledField
          id="ref-content-json"
          label="contentJson"
          register={form.register}
          name="contentJson"
          rows={12}
        />

        {errorMessage ? (
          <InfoCard className="border-neblirDanger bg-paleBlue/20">
            <p className="text-sm text-black">{errorMessage}</p>
          </InfoCard>
        ) : null}

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Creating…" : "Create reference entry"}
        </Button>
      </form>
    </SuperAdminSectionShell>
  );
}
