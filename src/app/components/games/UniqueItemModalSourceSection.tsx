"use client";

import { Button } from "@/app/components/shared/Button";
import { ItemTemplatePeekModal } from "@/app/components/games/ItemTemplatePeekModal";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { TextField } from "@/app/components/shared/TextField";
import type { CreateUniqueItemModalModel } from "@/app/components/games/useCreateUniqueItemModal";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import type { ItemBrowseDetailFields } from "@/app/lib/types/itemBrowseDetail";
import { useState } from "react";

type Props = {
  f: CreateUniqueItemModalModel;
};

export function UniqueItemModalSourceSection({ f }: Props) {
  const [peekItem, setPeekItem] = useState<ItemBrowseDetailFields | null>(null);

  if (f.isEdit) {
    return (
      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">Source</h3>
        <p className="rounded-md border border-white/20 bg-paleBlue/10 px-3 py-2 text-sm text-white">
          {f.editTemplateLabel ?? "Template"}
        </p>
        <p className="mt-2 text-xs text-white/55">
          The template cannot be changed after creation. Update overrides below.
        </p>
        {f.sourceType === "STANDALONE" ? (
          <div className="mt-3 space-y-3 rounded border border-white/20 bg-paleBlue/5 p-3">
            <div>
              <FieldLabel id="standalone-unique-name" label="Name" required />
              <TextField
                id="standalone-unique-name"
                type="text"
                variant="dark"
                value={f.nameOverride}
                onChange={(e) => f.setNameOverride(e.target.value)}
                disabled={f.submitting}
              />
            </div>
            <ModalNumberField
              id="standalone-unique-weight"
              label="Weight (kg)"
              value={f.weightOverride}
              onChange={f.setWeightOverride}
              disabled={f.submitting}
              min={0}
              step={0.1}
            />
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-white/90">
        {f.sourceType === "STANDALONE"
          ? "Custom item (no template)"
          : "Template (required)"}
      </h3>
      <div className="space-y-3">
        <RadioGroup
          name="sourceType"
          value={f.sourceType}
          tone="inverse"
          variant="chip"
          options={[
            { value: "GLOBAL_ITEM", label: "Global item" },
            { value: "CUSTOM_ITEM", label: "Game custom item" },
            { value: "STANDALONE", label: "No template" },
          ]}
          onChange={(value) => {
            if (
              value === "CUSTOM_ITEM" &&
              f.customTemplateGameIds.length === 0
            ) {
              return;
            }
            setPeekItem(null);
            f.setSourceType(
              value as "GLOBAL_ITEM" | "CUSTOM_ITEM" | "STANDALONE"
            );
            f.setSelectedTemplate(null);
          }}
          disabled={f.submitting}
        />
        {f.customTemplateGameIds.length === 0 && (
          <p className="text-xs text-white/60">
            No games available for custom templates.
          </p>
        )}

        {f.sourceType === "STANDALONE" ? (
          <div className="space-y-3 rounded border border-white/20 bg-paleBlue/5 p-3">
            <p className="text-sm text-white/80">
              For found objects, gifts, or anything that is not in the catalogs
              — only a name and weight are required.
            </p>
            <div>
              <FieldLabel id="standalone-unique-name" label="Name" required />
              <TextField
                id="standalone-unique-name"
                type="text"
                variant="dark"
                value={f.nameOverride}
                onChange={(e) => f.setNameOverride(e.target.value)}
                placeholder='e.g. "Mysterious bracelet"'
                disabled={f.submitting}
              />
            </div>
            <ModalNumberField
              id="standalone-unique-weight"
              label="Weight (kg)"
              value={f.weightOverride}
              onChange={f.setWeightOverride}
              disabled={f.submitting}
              min={0}
              step={0.1}
              placeholder="0"
            />
          </div>
        ) : (
          <>
            {f.loadingTemplates ? (
              <p className="text-sm text-white/70">Loading templates…</p>
            ) : (
              <>
                <SelectDropdown
                  id="unique-item-template"
                  label="Template"
                  placeholder="Select a template…"
                  value={f.selectedTemplate?.id ?? ""}
                  options={f.templateOptions}
                  disabled={f.submitting || f.templateOptions.length === 0}
                  onChange={(id) => {
                    if (!id) {
                      f.setSelectedTemplate(null);
                      return;
                    }
                    const t = f.templates.find((x) => x.id === id);
                    f.setSelectedTemplate(t ?? null);
                  }}
                  renderOptionSuffix={(opt, closeMenu) => (
                    <Button
                      type="button"
                      variant="lightTemplateInfoIcon"
                      fullWidth={false}
                      aria-label={`View template details: ${opt.label}`}
                      title="Template details"
                      onClick={() => {
                        closeMenu();
                        const detail = f.getTemplateBrowseDetail(opt.value);
                        if (detail) setPeekItem(detail);
                      }}
                    >
                      i
                    </Button>
                  )}
                />
                {f.templateOptions.length === 0 && (
                  <p className="mt-2 text-sm text-white/60">
                    {f.sourceType === "CUSTOM_ITEM" &&
                    f.customTemplateGameIds.length === 0
                      ? "Link this character to a game to use custom item templates, or choose a global item above."
                      : "No templates available."}
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>

      <ItemTemplatePeekModal
        item={peekItem}
        onClose={() => setPeekItem(null)}
      />
    </section>
  );
}
