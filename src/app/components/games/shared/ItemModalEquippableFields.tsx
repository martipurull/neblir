import { Checkbox } from "@/app/components/shared/Checkbox";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { EQUIP_SLOTS } from "@/app/lib/constants/itemCatalogue";

type Props = {
  disabled: boolean;
  equippable: boolean;
  onEquippableChange: (value: boolean) => void;
  equipSlotTypes: string[];
  onToggleEquipSlot: (value: string) => void;
  equipSlotCost: string;
  onEquipSlotCostChange: (value: string) => void;
};

export function ItemModalEquippableFields({
  disabled,
  equippable,
  onEquippableChange,
  equipSlotTypes,
  onToggleEquipSlot,
  equipSlotCost,
  onEquipSlotCostChange,
}: Props) {
  return (
    <div className="space-y-3">
      <Checkbox
        checked={equippable}
        onChange={onEquippableChange}
        disabled={disabled}
        tone="inverse"
        label="Can be equipped"
      />
      {equippable && (
        <>
          <div>
            <FieldLabel id="custom-item-equip-slots" label="Equip slots" />
            <div className="flex flex-wrap gap-2">
              {EQUIP_SLOTS.map((s) => (
                <Checkbox
                  key={s.value}
                  checked={equipSlotTypes.includes(s.value)}
                  onChange={() => onToggleEquipSlot(s.value)}
                  disabled={disabled}
                  tone="inverse"
                  label={s.label}
                />
              ))}
            </div>
          </div>
          <ModalNumberField
            id="custom-item-equip-slot-cost"
            label="Equip slot cost (0, 1, or 2)"
            value={equipSlotCost}
            onChange={onEquipSlotCostChange}
            disabled={disabled}
            required={false}
            min={0}
            max={2}
          />
        </>
      )}
    </div>
  );
}
