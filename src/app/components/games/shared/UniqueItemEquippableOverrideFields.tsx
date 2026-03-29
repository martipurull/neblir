import { Checkbox } from "@/app/components/shared/Checkbox";
import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { modalInputClass } from "@/app/components/games/shared/modalStyles";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import { EQUIP_SLOTS } from "./itemModalConstants";

type Props = {
  disabled: boolean;
  equippableOverride: boolean | "";
  onEquippableOverrideChange: (value: boolean | "") => void;
  equipSlotTypesOverride: string[];
  onToggleEquipSlot: (value: string) => void;
  equipSlotCostOverride: string;
  onEquipSlotCostOverrideChange: (value: string) => void;
  maxUsesOverride: string;
  onMaxUsesOverrideChange: (value: string) => void;
};

export function UniqueItemEquippableOverrideFields({
  disabled,
  equippableOverride,
  onEquippableOverrideChange,
  equipSlotTypesOverride,
  onToggleEquipSlot,
  equipSlotCostOverride,
  onEquipSlotCostOverrideChange,
  maxUsesOverride,
  onMaxUsesOverrideChange,
}: Props) {
  return (
    <>
      <div>
        <ModalFieldLabel
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
            <ModalFieldLabel
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
          <div>
            <ModalFieldLabel
              id="unique-equip-slot-cost-override"
              label="Equip slot cost (0–2)"
            />
            <input
              id="unique-equip-slot-cost-override"
              type="number"
              min={0}
              max={2}
              value={equipSlotCostOverride}
              onChange={(e) => onEquipSlotCostOverrideChange(e.target.value)}
              className={modalInputClass}
              disabled={disabled}
            />
          </div>
        </>
      )}
      <div>
        <ModalFieldLabel
          id="unique-max-uses-override"
          label="Max uses override"
        />
        <input
          id="unique-max-uses-override"
          type="number"
          min={1}
          value={maxUsesOverride}
          onChange={(e) => onMaxUsesOverrideChange(e.target.value)}
          className={modalInputClass}
          placeholder="Leave empty to use template"
          disabled={disabled}
        />
      </div>
    </>
  );
}
