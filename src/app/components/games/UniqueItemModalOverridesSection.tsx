import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
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
        <div>
          <ModalFieldLabel
            id="unique-desc-override"
            label="Description override"
          />
          <textarea
            id="unique-desc-override"
            value={f.descriptionOverride}
            onChange={(e) => f.setDescriptionOverride(e.target.value)}
            className={modalInputClass + " min-h-[60px]"}
            placeholder="Override description"
            disabled={f.submitting}
            rows={2}
          />
        </div>
        <div>
          <ModalFieldLabel id="unique-usage-override" label="Usage override" />
          <textarea
            id="unique-usage-override"
            value={f.usageOverride}
            onChange={(e) => f.setUsageOverride(e.target.value)}
            className={modalInputClass + " min-h-[60px]"}
            disabled={f.submitting}
            rows={2}
          />
        </div>
        <div>
          <ModalFieldLabel id="unique-notes-override" label="Notes override" />
          <textarea
            id="unique-notes-override"
            value={f.notesOverride}
            onChange={(e) => f.setNotesOverride(e.target.value)}
            className={modalInputClass + " min-h-[60px]"}
            disabled={f.submitting}
            rows={2}
          />
        </div>
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
            <div>
              <ModalFieldLabel
                id="unique-weight-override"
                label="Weight override"
              />
              <input
                id="unique-weight-override"
                type="number"
                min={0}
                step={0.1}
                value={f.weightOverride}
                onChange={(e) => f.setWeightOverride(e.target.value)}
                className={modalInputClass}
                disabled={f.submitting}
              />
            </div>
          )}
          <div>
            <ModalFieldLabel
              id="unique-conf-cost-override"
              label="Conf cost override"
            />
            <input
              id="unique-conf-cost-override"
              type="number"
              min={0}
              value={f.confCostOverride}
              onChange={(e) => f.setConfCostOverride(e.target.value)}
              className={modalInputClass}
              disabled={f.submitting}
            />
          </div>
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
