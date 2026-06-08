import {
  ATTRIBUTE_OPTIONS,
  GENERAL_SKILL_OPTIONS,
} from "@/app/(pages)/home/characters/[id]/level-up/constants";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { ModalSelect } from "@/app/components/games/shared/ModalSelect";
import { RadioGroup } from "@/app/components/shared/RadioGroup";

const noneSelectOption = { value: "", label: "None" };

const attributePathOptions = [noneSelectOption, ...ATTRIBUTE_OPTIONS];

const generalSkillOptions = [noneSelectOption, ...GENERAL_SKILL_OPTIONS];

type Props = {
  standalone: boolean;
  disabled: boolean;
  maxUsesOverride: string;
  onMaxUsesOverrideChange: (value: string) => void;
  modifiesAttributeOverride: string;
  onModifiesAttributeOverrideChange: (value: string) => void;
  attributeModOverride: string;
  onAttributeModOverrideChange: (value: string) => void;
  modifiesSkillOverride: string;
  onModifiesSkillOverrideChange: (value: string) => void;
  skillModOverride: string;
  onSkillModOverrideChange: (value: string) => void;
  /** Template flow: "" = use template. Standalone: ignored — use `isSpeedAlteredStandalone`. */
  isSpeedAlteredOverride: boolean | "";
  onIsSpeedAlteredOverrideChange: (value: boolean | "") => void;
  isSpeedAlteredStandalone: boolean;
  onIsSpeedAlteredStandaloneChange: (value: boolean) => void;
};

export function UniqueItemStatModifierOverrideFields({
  standalone,
  disabled,
  maxUsesOverride,
  onMaxUsesOverrideChange,
  modifiesAttributeOverride,
  onModifiesAttributeOverrideChange,
  attributeModOverride,
  onAttributeModOverrideChange,
  modifiesSkillOverride,
  onModifiesSkillOverrideChange,
  skillModOverride,
  onSkillModOverrideChange,
  isSpeedAlteredOverride,
  onIsSpeedAlteredOverrideChange,
  isSpeedAlteredStandalone,
  onIsSpeedAlteredStandaloneChange,
}: Props) {
  const maxUsesLabel = standalone ? "Max uses" : "Max uses override";
  const maxUsesPlaceholder = standalone
    ? "Leave empty for unlimited"
    : "Leave empty to use template";
  const attributeLabel = standalone
    ? "Modifies attribute (optional)"
    : "Modifies attribute override (optional)";
  const attributePlaceholder = standalone ? "Attribute" : "Use template";
  const attributeModLabel = standalone
    ? "Attribute mod (optional)"
    : "Attribute mod override (optional)";
  const skillLabel = standalone
    ? "Modifies general skill (optional)"
    : "Modifies general skill override (optional)";
  const skillPlaceholder = standalone ? "Skill" : "Use template";
  const skillModLabel = standalone
    ? "Skill mod (optional)"
    : "Skill mod override (optional)";

  return (
    <div className="space-y-3">
      <ModalNumberField
        id="unique-max-uses-override"
        label={maxUsesLabel}
        value={maxUsesOverride}
        onChange={onMaxUsesOverrideChange}
        disabled={disabled}
        required={false}
        min={1}
        placeholder={maxUsesPlaceholder}
      />
      {!standalone ? (
        <p className="-mt-1 text-xs text-white/55">
          Positive integer only. Leave blank to inherit from the template.
        </p>
      ) : (
        <p className="-mt-1 text-xs text-white/55">
          Positive integer only. Leave blank for unlimited charges.
        </p>
      )}
      <ModalSelect
        id="unique-modifies-attribute-override"
        label={attributeLabel}
        placeholder={attributePlaceholder}
        value={modifiesAttributeOverride}
        options={attributePathOptions}
        disabled={disabled}
        onChange={onModifiesAttributeOverrideChange}
      />
      <ModalNumberField
        id="unique-attribute-mod-override"
        label={attributeModLabel}
        value={attributeModOverride}
        onChange={onAttributeModOverrideChange}
        disabled={disabled}
        required={false}
        placeholder="e.g. 1 or −1"
      />
      <ModalSelect
        id="unique-modifies-skill-override"
        label={skillLabel}
        placeholder={skillPlaceholder}
        value={modifiesSkillOverride}
        options={generalSkillOptions}
        disabled={disabled}
        onChange={onModifiesSkillOverrideChange}
      />
      <ModalNumberField
        id="unique-skill-mod-override"
        label={skillModLabel}
        value={skillModOverride}
        onChange={onSkillModOverrideChange}
        disabled={disabled}
        required={false}
        placeholder="e.g. 1 or −1"
      />
      {standalone ? (
        <>
          <Checkbox
            checked={isSpeedAlteredStandalone}
            onChange={onIsSpeedAlteredStandaloneChange}
            disabled={disabled}
            tone="inverse"
            label="Alters speed"
          />
          <p className="-mt-1 text-xs text-white/55">
            When checked, this item counts as changing the character&apos;s
            speed for rules that care about that flag.
          </p>
        </>
      ) : (
        <>
          <div>
            <FieldLabel
              id="unique-speed-altered-override"
              label="Alters speed override"
            />
            <RadioGroup
              name="isSpeedAlteredOverride"
              value={
                isSpeedAlteredOverride === ""
                  ? "template"
                  : isSpeedAlteredOverride
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
                  onIsSpeedAlteredOverrideChange("");
                } else {
                  onIsSpeedAlteredOverrideChange(value === "yes");
                }
              }}
              disabled={disabled}
            />
          </div>
          <p className="-mt-1 text-xs text-white/55">
            Override whether this item changes the character&apos;s speed. Leave
            on “Use template” to inherit from the base item.
          </p>
        </>
      )}
    </div>
  );
}
