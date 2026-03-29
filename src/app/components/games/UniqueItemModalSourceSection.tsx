import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { modalInputClass } from "@/app/components/games/shared/modalStyles";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import type { CreateUniqueItemModalModel } from "@/app/components/games/useCreateUniqueItemModal";

type Props = {
  f: CreateUniqueItemModalModel;
};

export function UniqueItemModalSourceSection({ f }: Props) {
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
          <div className="space-y-3 rounded border border-white/20 bg-white/5 p-3">
            <p className="text-sm text-white/80">
              For found objects, gifts, or anything that is not in the catalogs
              — only a name and weight are required.
            </p>
            <div>
              <ModalFieldLabel
                id="standalone-unique-name"
                label="Name"
                required
              />
              <input
                id="standalone-unique-name"
                type="text"
                value={f.nameOverride}
                onChange={(e) => f.setNameOverride(e.target.value)}
                className={modalInputClass}
                placeholder='e.g. "Mysterious bracelet"'
                disabled={f.submitting}
              />
            </div>
            <div>
              <ModalFieldLabel
                id="standalone-unique-weight"
                label="Weight (kg)"
                required
              />
              <input
                id="standalone-unique-weight"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={f.weightOverride}
                onChange={(e) => f.setWeightOverride(e.target.value)}
                className={modalInputClass}
                placeholder="0"
                disabled={f.submitting}
              />
            </div>
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
    </section>
  );
}
