import type { UseFormReturn } from "react-hook-form";
import Button from "@/app/components/shared/Button";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import type { LevelUpFormValues } from "./types";

type AttributeOption =
  | { value: string; label: string }
  | {
      value: string;
      label: string;
      disabled: true;
      disabledHint: string;
    };

type Props = {
  form: UseFormReturn<LevelUpFormValues>;
  seriousFlag: LevelUpFormValues["hasSeriousInjuryOrTrauma"];
  attributeSwapFromOptions: AttributeOption[];
  attributeSwapToOptions: AttributeOption[];
  attributeError: string | undefined;
  onOpenQuickCheck: () => void;
};

export default function LevelUpAttributesStep({
  form,
  seriousFlag,
  attributeSwapFromOptions,
  attributeSwapToOptions,
  attributeError,
  onOpenQuickCheck,
}: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-black/70 lg:text-center">
        Has the character sustained a serious injury or serious trauma?
      </p>
      <RadioGroup
        name="hasSeriousInjuryOrTrauma"
        value={seriousFlag}
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ]}
        onChange={(value) =>
          form.setValue(
            "hasSeriousInjuryOrTrauma",
            value as LevelUpFormValues["hasSeriousInjuryOrTrauma"],
            {
              shouldDirty: true,
            }
          )
        }
      />
      {form.formState.errors.hasSeriousInjuryOrTrauma?.message && (
        <p className="text-sm text-neblirDanger-600" role="alert">
          {form.formState.errors.hasSeriousInjuryOrTrauma.message}
        </p>
      )}

      {seriousFlag === "yes" && (
        <div className="space-y-4">
          <Button
            type="button"
            variant="lightOutlineMuted"
            fullWidth={false}
            onClick={onOpenQuickCheck}
          >
            Check current attributes
          </Button>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectDropdown
              id="attribute-from"
              label="From"
              placeholder="No attribute moved"
              value={form.watch("fromAttribute")}
              options={attributeSwapFromOptions}
              pinValueFirst=""
              onChange={(v) =>
                form.setValue(
                  "fromAttribute",
                  v as LevelUpFormValues["fromAttribute"],
                  {
                    shouldDirty: true,
                  }
                )
              }
            />
            <SelectDropdown
              id="attribute-to"
              label="To"
              placeholder="No attribute moved"
              value={form.watch("toAttribute")}
              options={attributeSwapToOptions}
              pinValueFirst=""
              onChange={(v) =>
                form.setValue(
                  "toAttribute",
                  v as LevelUpFormValues["toAttribute"],
                  {
                    shouldDirty: true,
                  }
                )
              }
            />
          </div>
        </div>
      )}
      {attributeError && (
        <p className="text-sm text-neblirDanger-600" role="alert">
          {attributeError}
        </p>
      )}
    </div>
  );
}
