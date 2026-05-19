import { GameModalRichTextField } from "@/app/components/games/shared/GameModalRichTextField";
import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { modalInputClass } from "@/app/components/games/shared/modalStyles";
import { ItemModalWeaponFields } from "@/app/components/games/shared/ItemModalWeaponFields";
import { UniqueItemEquippableOverrideFields } from "@/app/components/games/shared/UniqueItemEquippableOverrideFields";
import type { CreateUniqueItemModalModel } from "@/app/components/games/useCreateUniqueItemModal";

type Props = {
  f: CreateUniqueItemModalModel;
};

export function UniqueItemModalOverridesSection({ f }: Props) {
  const standalone = f.sourceType === "STANDALONE";

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-white/90">
        {standalone
          ? "Extra details (all optional)"
          : "Overrides (all optional)"}
      </h3>
      <p className="mb-3 text-xs text-white/55">
        Description, usage, and notes overrides use rich text (stored as HTML),
        same as global catalogue items.
      </p>
      <div className="space-y-3">
        {!standalone && (
          <div>
            <ModalFieldLabel id="unique-name-override" label="Name override" />
            <input
              id="unique-name-override"
              type="text"
              value={f.nameOverride}
              onChange={(e) => f.setNameOverride(e.target.value)}
              className={modalInputClass}
              placeholder="Override display name"
              disabled={f.submitting}
            />
          </div>
        )}
        <GameModalRichTextField
          id="unique-desc-override"
          label="Description override"
          value={f.descriptionOverride}
          onChange={f.setDescriptionOverride}
          disabled={f.submitting}
          syncKey={f.richTextSyncKey}
        />
        <GameModalRichTextField
          id="unique-usage-override"
          label="Usage override"
          value={f.usageOverride}
          onChange={f.setUsageOverride}
          disabled={f.submitting}
          syncKey={f.richTextSyncKey}
        />
        <GameModalRichTextField
          id="unique-notes-override"
          label="Notes override"
          value={f.notesOverride}
          onChange={f.setNotesOverride}
          disabled={f.submitting}
          syncKey={f.richTextSyncKey}
        />
        <div>
          <ModalFieldLabel id="unique-special-tag" label="Special tag" />
          <input
            id="unique-special-tag"
            type="text"
            value={f.specialTag}
            onChange={(e) => f.setSpecialTag(e.target.value)}
            className={modalInputClass}
            placeholder="e.g. AMPLIFIED, PROTOTYPE"
            disabled={f.submitting}
          />
        </div>
        <div
          className={
            standalone ? "grid grid-cols-1 gap-2" : "grid grid-cols-2 gap-2"
          }
        >
          {!standalone && (
            <ModalNumberField
              id="unique-weight-override"
              label="Weight override"
              value={f.weightOverride}
              onChange={f.setWeightOverride}
              disabled={f.submitting}
              required={false}
              min={0}
              step={0.1}
            />
          )}
          <ModalNumberField
            id="unique-conf-cost-override"
            label="Conf cost override"
            value={f.confCostOverride}
            onChange={f.setConfCostOverride}
            disabled={f.submitting}
            required={false}
            min={0}
          />
        </div>
        <div>
          <ModalFieldLabel
            id="unique-cost-info-override"
            label="Cost info override"
          />
          <input
            id="unique-cost-info-override"
            type="text"
            value={f.costInfoOverride}
            onChange={(e) => f.setCostInfoOverride(e.target.value)}
            className={modalInputClass}
            disabled={f.submitting}
          />
        </div>

        <ItemModalWeaponFields
          fieldIdPreset="unique"
          disabled={f.submitting}
          attackRollLabel="Attack roll override"
          attackRoll={f.attackRollOverride}
          onToggleAttackRoll={f.toggleAttackRoll}
          attackMeleeBonus={f.attackMeleeBonusOverride}
          onAttackMeleeBonusChange={f.setAttackMeleeBonusOverride}
          attackRangeBonus={f.attackRangeBonusOverride}
          onAttackRangeBonusChange={f.setAttackRangeBonusOverride}
          attackThrowBonus={f.attackThrowBonusOverride}
          onAttackThrowBonusChange={f.setAttackThrowBonusOverride}
          gridAttackBonus={f.gridAttackBonusOverride}
          onGridAttackBonusChange={f.setGridAttackBonusOverride}
          defenceMeleeBonus={f.defenceMeleeBonusOverride}
          onDefenceMeleeBonusChange={f.setDefenceMeleeBonusOverride}
          defenceRangeBonus={f.defenceRangeBonusOverride}
          onDefenceRangeBonusChange={f.setDefenceRangeBonusOverride}
          gridDefenceBonus={f.gridDefenceBonusOverride}
          onGridDefenceBonusChange={f.setGridDefenceBonusOverride}
          effectiveRange={f.effectiveRangeOverride}
          onEffectiveRangeChange={f.setEffectiveRangeOverride}
          maxRange={f.maxRangeOverride}
          onMaxRangeChange={f.setMaxRangeOverride}
          damageTypes={f.damageTypesOverride}
          onToggleDamageType={f.toggleDamageType}
          damageDiceType={f.damageDiceTypeOverride}
          onDamageDiceTypeChange={f.setDamageDiceTypeOverride}
          damageNumberOfDice={f.damageNumberOfDiceOverride}
          onDamageNumberOfDiceChange={f.setDamageNumberOfDiceOverride}
          damageTypesLayout="two-rows"
          rangePlaceholder="Leave empty to use template"
          damageTypesLabel="Damage override — types"
          diceTypeLabel="Damage dice type"
        />

        <UniqueItemEquippableOverrideFields
          disabled={f.submitting}
          equippableOverride={f.equippableOverride}
          onEquippableOverrideChange={f.setEquippableOverride}
          equipSlotTypesOverride={f.equipSlotTypesOverride}
          onToggleEquipSlot={f.toggleEquipSlot}
          equipSlotCostOverride={f.equipSlotCostOverride}
          onEquipSlotCostOverrideChange={f.setEquipSlotCostOverride}
          maxUsesOverride={f.maxUsesOverride}
          onMaxUsesOverrideChange={f.setMaxUsesOverride}
        />
      </div>
    </section>
  );
}
