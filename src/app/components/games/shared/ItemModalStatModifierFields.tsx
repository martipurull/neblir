import {
  ATTRIBUTE_OPTIONS,
  GENERAL_SKILL_OPTIONS,
} from "@/app/(pages)/home/characters/[id]/level-up/constants";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { ModalSelect } from "@/app/components/games/shared/ModalSelect";

const noneSelectOption = { value: "", label: "None" };

const attributePathOptions = [noneSelectOption, ...ATTRIBUTE_OPTIONS];

const generalSkillOptions = [noneSelectOption, ...GENERAL_SKILL_OPTIONS];

type Props = {
  fieldIdPrefix: string;
  disabled: boolean;
  maxUses: string;
  onMaxUsesChange: (value: string) => void;
  modifiesAttribute: string;
  onModifiesAttributeChange: (value: string) => void;
  attributeMod: string;
  onAttributeModChange: (value: string) => void;
  modifiesSkill: string;
  onModifiesSkillChange: (value: string) => void;
  skillMod: string;
  onSkillModChange: (value: string) => void;
  isSpeedAltered: boolean;
  onIsSpeedAlteredChange: (value: boolean) => void;
};

export function ItemModalStatModifierFields({
  fieldIdPrefix,
  disabled,
  maxUses,
  onMaxUsesChange,
  modifiesAttribute,
  onModifiesAttributeChange,
  attributeMod,
  onAttributeModChange,
  modifiesSkill,
  onModifiesSkillChange,
  skillMod,
  onSkillModChange,
  isSpeedAltered,
  onIsSpeedAlteredChange,
}: Props) {
  return (
    <div className="space-y-3">
      <ModalNumberField
        id={`${fieldIdPrefix}-max-uses`}
        label="Max uses"
        value={maxUses}
        onChange={onMaxUsesChange}
        disabled={disabled}
        required={false}
        min={1}
        placeholder="Leave empty for unlimited"
      />
      <p className="-mt-1 text-xs text-white/55">
        Positive integer only. Leave blank for unlimited charges.
      </p>
      <ModalSelect
        id={`${fieldIdPrefix}-modifies-attribute`}
        label="Modifies attribute (optional)"
        placeholder="Attribute"
        value={modifiesAttribute}
        options={attributePathOptions}
        disabled={disabled}
        onChange={onModifiesAttributeChange}
      />
      <ModalNumberField
        id={`${fieldIdPrefix}-attribute-mod`}
        label="Attribute mod (optional)"
        value={attributeMod}
        onChange={onAttributeModChange}
        disabled={disabled}
        required={false}
        placeholder="e.g. 1 or −1"
      />
      <ModalSelect
        id={`${fieldIdPrefix}-modifies-skill`}
        label="Modifies general skill (optional)"
        placeholder="Skill"
        value={modifiesSkill}
        options={generalSkillOptions}
        disabled={disabled}
        onChange={onModifiesSkillChange}
      />
      <ModalNumberField
        id={`${fieldIdPrefix}-skill-mod`}
        label="Skill mod (optional)"
        value={skillMod}
        onChange={onSkillModChange}
        disabled={disabled}
        required={false}
        placeholder="e.g. 1 or −1"
      />
      <Checkbox
        checked={isSpeedAltered}
        onChange={onIsSpeedAlteredChange}
        disabled={disabled}
        tone="inverse"
        label="Alters speed"
      />
      <p className="-mt-1 text-xs text-white/55">
        When checked, this item counts as changing the character&apos;s speed
        for rules that care about that flag.
      </p>
    </div>
  );
}
