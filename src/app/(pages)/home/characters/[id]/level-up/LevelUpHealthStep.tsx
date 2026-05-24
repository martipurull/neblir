import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/app/components/shared/Button";
import { NumberField } from "@/app/components/shared/NumberField";
import { Controller } from "react-hook-form";
import { rollD10 } from "./character-helpers";
import type { LevelUpFormValues } from "./types";

type HealthPreview = {
  currentPhysical: number;
  currentPhysicalMax: number;
  nextPhysical: number;
  nextPhysicalMax: number;
  currentMental: number;
  currentMentalMax: number;
  nextMental: number;
  nextMentalMax: number;
};

type Props = {
  form: UseFormReturn<LevelUpFormValues>;
  healthPreview: HealthPreview | null;
  healthError: string | undefined;
};

export default function LevelUpHealthStep({
  form,
  healthPreview,
  healthError,
}: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-black/70">
        Roll +1d10 for physical and +1d10 for mental health. These values are
        added to both max and current health.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded border border-black/20 p-3">
          <p className="mb-2 font-medium">Physical health roll</p>
          <div className="flex items-center gap-2">
            <Controller
              name="rolledPhysicalHealth"
              control={form.control}
              render={({ field }) => (
                <NumberField
                  id="level-up-rolled-physical"
                  min={1}
                  max={10}
                  value={
                    field.value === undefined || field.value === null
                      ? ""
                      : String(field.value)
                  }
                  stepperLabel="Physical health roll"
                  onChange={(raw) => {
                    const n = parseInt(raw, 10);
                    field.onChange(Number.isNaN(n) ? undefined : n);
                  }}
                  onBlur={field.onBlur}
                  className="!w-24 !min-h-9"
                  inputClassName="px-2 py-1"
                />
              )}
            />
            <Button
              type="button"
              variant="lightRollChip"
              fullWidth={false}
              onClick={() =>
                form.setValue("rolledPhysicalHealth", rollD10(), {
                  shouldDirty: true,
                })
              }
            >
              Roll d10
            </Button>
          </div>
          {healthPreview && (
            <div className="mt-2 flex items-center gap-2 rounded border border-black/15 bg-transparent px-2 py-1.5 text-xs">
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wide text-black/50">
                  Current health
                </p>
                <p className="font-medium text-black/80">
                  {healthPreview.currentPhysical} /{" "}
                  {healthPreview.currentPhysicalMax}
                </p>
              </div>
              <span className="text-sm text-black/50" aria-hidden>
                →
              </span>
              <div className="flex-1 text-right">
                <p className="text-[10px] uppercase tracking-wide text-black/50">
                  After level-up
                </p>
                <p className="font-semibold text-black">
                  {healthPreview.nextPhysical} / {healthPreview.nextPhysicalMax}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="rounded border border-black/20 p-3">
          <p className="mb-2 font-medium">Mental health roll</p>
          <div className="flex items-center gap-2">
            <Controller
              name="rolledMentalHealth"
              control={form.control}
              render={({ field }) => (
                <NumberField
                  id="level-up-rolled-mental"
                  min={1}
                  max={10}
                  value={
                    field.value === undefined || field.value === null
                      ? ""
                      : String(field.value)
                  }
                  stepperLabel="Mental health roll"
                  onChange={(raw) => {
                    const n = parseInt(raw, 10);
                    field.onChange(Number.isNaN(n) ? undefined : n);
                  }}
                  onBlur={field.onBlur}
                  className="!w-24 !min-h-9"
                  inputClassName="px-2 py-1"
                />
              )}
            />
            <Button
              type="button"
              variant="lightRollChip"
              fullWidth={false}
              onClick={() =>
                form.setValue("rolledMentalHealth", rollD10(), {
                  shouldDirty: true,
                })
              }
            >
              Roll d10
            </Button>
          </div>
          {healthPreview && (
            <div className="mt-2 flex items-center gap-2 rounded border border-black/15 bg-transparent px-2 py-1.5 text-xs">
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wide text-black/50">
                  Current health
                </p>
                <p className="font-medium text-black/80">
                  {healthPreview.currentMental} /{" "}
                  {healthPreview.currentMentalMax}
                </p>
              </div>
              <span className="text-sm text-black/50" aria-hidden>
                →
              </span>
              <div className="flex-1 text-right">
                <p className="text-[10px] uppercase tracking-wide text-black/50">
                  After level-up
                </p>
                <p className="font-semibold text-black">
                  {healthPreview.nextMental} / {healthPreview.nextMentalMax}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {healthError && (
        <p className="text-sm text-neblirDanger-600" role="alert">
          {healthError}
        </p>
      )}
    </div>
  );
}
