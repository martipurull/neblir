import { Checkbox } from "@/app/components/shared/Checkbox";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import { EQUIP_SLOTS } from "@/app/lib/constants/itemCatalogue";

type Props = {
  disabled: boolean;
  equippableOverride: boolean | "";
  onEquippableOverrideChange: (value: boolean | "") => void;
  equipSlotTypesOverride: string[];
  onToggleEquipSlot: (value: string) => void;
  equipSlotCostOverride: string;
  onEquipSlotCostOverrideChange: (value: string) => void;
};

export function UniqueItemEquippableOverrideFields({
  disabled,
  equippableOverride,
  onEquippableOverrideChange,
  equipSlotTypesOverride,
  onToggleEquipSlot,
  equipSlotCostOverride,
  onEquipSlotCostOverrideChange,
}: Props) {
  return (
    <>
      <div>
        <FieldLabel
          id="unique-equippable-override"
          label="Equippable override"
        />
        <RadioGroup
          name="equippableOverride"
          value={
            equippableOverride === ""
              ? "template"
              : equippableOverride
                ? "yes"
                : "no"
          }
          tone="inverse"
          variant="chip"
          options={[
            { value: "template", label: "Use template" },
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          onChange={(value) => {
            if (value === "template") {
              onEquippableOverrideChange("");
            } else {
              onEquippableOverrideChange(value === "yes");
            }
          }}
          disabled={disabled}
        />
      </div>
      {equippableOverride !== "" && (
        <>
          <div>
            <FieldLabel
              id="unique-equip-slots-override"
              label="Equip slots override"
            />
            <div className="flex flex-wrap gap-2">
              {EQUIP_SLOTS.map((s) => (
                <Checkbox
                  key={s.value}
                  checked={equipSlotTypesOverride.includes(s.value)}
                  onChange={() => onToggleEquipSlot(s.value)}
                  disabled={disabled}
                  tone="inverse"
                  label={s.label}
                />
              ))}
            </div>
          </div>
          <ModalNumberField
            id="unique-equip-slot-cost-override"
            label="Equip slot cost (0–2)"
            value={equipSlotCostOverride}
            onChange={onEquipSlotCostOverrideChange}
            disabled={disabled}
            required={false}
            min={0}
            max={2}
          />
        </>
      )}
    </>
  );
}
