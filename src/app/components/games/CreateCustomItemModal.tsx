"use client";

import { GameModalRichTextField } from "@/app/components/games/shared/GameModalRichTextField";
import { ImageUploadDropzone } from "@/app/components/shared/ImageUploadDropzone";
import { GameFormModalDraftChrome } from "@/app/components/games/GameFormModalDraftChrome";
import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { TextField } from "@/app/components/shared/TextField";
import { ItemModalEquippableFields } from "@/app/components/games/shared/ItemModalEquippableFields";
import { ItemModalStatModifierFields } from "@/app/components/games/shared/ItemModalStatModifierFields";
import { ItemModalWeaponFields } from "@/app/components/games/shared/ItemModalWeaponFields";
import { useCreateCustomItemModal } from "@/app/components/games/useCreateCustomItemModal";
const ITEM_TYPES = [
  { value: "GENERAL_ITEM", label: "General item" },
  { value: "WEAPON", label: "Weapon" },
] as const;

type CreateCustomItemModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  /** When set, modal loads that item and PATCHes on submit. */
  editCustomItemId?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function CreateCustomItemModal({
  isOpen,
  gameId,
  gameName,
  editCustomItemId = null,
  onClose,
  onSuccess,
}: CreateCustomItemModalProps) {
  const f = useCreateCustomItemModal({
    gameId,
    isOpen,
    editCustomItemId,
    onClose,
    onSuccess,
  });
  const isEdit = Boolean(editCustomItemId);

  return (
    <GameFormModalDraftChrome
      isOpen={isOpen}
      isEdit={isEdit}
      draftPersistenceEnabled={f.draftPersistenceEnabled}
      draftRestored={f.draftRestored}
      hasDiscardableDraft={f.hasDiscardableDraft}
      entityLabel="custom item"
      onDismiss={() => void f.handleClose()}
      onForceClose={() => void f.handleClose(true)}
      onDiscardAndClose={f.discardAndClose}
    >
      {({ onClose: dismiss, onCancel, cancelLabel, draftRestoredNotice }) => (
        <GameFormModal
          isOpen={isOpen}
          title={
            isEdit
              ? `Edit custom item — ${gameName}`
              : `Create custom item — ${gameName}`
          }
          subtitle={
            <>
              Fields marked with{" "}
              <span className="text-neblirDanger-400">*</span> are required.
              Optional fields can be left blank.
            </>
          }
          titleId="create-custom-item-title"
          error={f.error}
          onClose={dismiss}
          onCancel={onCancel}
          onSubmit={(e) => void f.handleSubmit(e)}
          submitting={f.submitting}
          cancelLabel={cancelLabel}
          submitLabel={isEdit ? "Save changes" : "Create custom item"}
          submittingLabel={isEdit ? "Saving…" : "Creating…"}
        >
          {draftRestoredNotice}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-white/90">Basics</h3>
            <div className="space-y-3">
              <div>
                <FieldLabel id="custom-item-name" label="Name" required />
                <TextField
                  id="custom-item-name"
                  type="text"
                  variant="dark"
                  value={f.name}
                  onChange={(e) => f.setName(e.target.value)}
                  placeholder="e.g. Combat knife"
                  disabled={f.submitting}
                />
              </div>
              <ModalNumberField
                id="custom-item-weight"
                label="Weight"
                value={f.weight}
                onChange={f.setWeight}
                disabled={f.submitting}
                min={0}
                step={0.1}
                placeholder="0"
              />
              <div>
                <SelectDropdown
                  id="custom-item-type"
                  label="Type"
                  placeholder="Select type"
                  value={f.type}
                  options={[...ITEM_TYPES]}
                  disabled={f.submitting}
                  onChange={(v) => f.setType(v as "GENERAL_ITEM" | "WEAPON")}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-white/90">
              Description &amp; usage
            </h3>
            <p className="mb-3 text-xs text-white/55">
              Description, usage, and notes use the same rich text editor as
              global catalogue items (stored as HTML).
            </p>
            <div className="space-y-3">
              <GameModalRichTextField
                id="custom-item-description"
                label="Description"
                value={f.description}
                onChange={f.setDescription}
                disabled={f.submitting}
                syncKey={f.richTextSyncKey}
              />
              <GameModalRichTextField
                id="custom-item-usage"
                label="Usage"
                value={f.usage}
                onChange={f.setUsage}
                disabled={f.submitting}
                syncKey={f.richTextSyncKey}
              />
              <GameModalRichTextField
                id="custom-item-notes"
                label="Notes"
                value={f.notes}
                onChange={f.setNotes}
                disabled={f.submitting}
                syncKey={f.richTextSyncKey}
              />
              <ModalNumberField
                id="custom-item-conf-cost"
                label="Conf cost"
                value={f.confCost}
                onChange={f.setConfCost}
                disabled={f.submitting}
                required={false}
                min={0}
                placeholder="0"
              />
              <div>
                <FieldLabel id="custom-item-cost-info" label="Cost info" />
                <TextField
                  id="custom-item-cost-info"
                  type="text"
                  variant="dark"
                  value={f.costInfo}
                  onChange={(e) => f.setCostInfo(e.target.value)}
                  placeholder="e.g. Not for sale"
                  disabled={f.submitting}
                />
              </div>
            </div>
          </section>

          {f.type === "WEAPON" && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-white/90">
                Weapon &amp; combat
              </h3>
              <ItemModalWeaponFields
                fieldIdPreset="custom"
                disabled={f.submitting}
                attackRoll={f.attackRoll}
                onToggleAttackRoll={f.toggleAttackRoll}
                attackMeleeBonus={f.attackMeleeBonus}
                onAttackMeleeBonusChange={f.setAttackMeleeBonus}
                attackRangeBonus={f.attackRangeBonus}
                onAttackRangeBonusChange={f.setAttackRangeBonus}
                attackThrowBonus={f.attackThrowBonus}
                onAttackThrowBonusChange={f.setAttackThrowBonus}
                gridAttackBonus={f.gridAttackBonus}
                onGridAttackBonusChange={f.setGridAttackBonus}
                defenceMeleeBonus={f.defenceMeleeBonus}
                onDefenceMeleeBonusChange={f.setDefenceMeleeBonus}
                defenceRangeBonus={f.defenceRangeBonus}
                onDefenceRangeBonusChange={f.setDefenceRangeBonus}
                gridDefenceBonus={f.gridDefenceBonus}
                onGridDefenceBonusChange={f.setGridDefenceBonus}
                effectiveRange={f.effectiveRange}
                onEffectiveRangeChange={f.setEffectiveRange}
                maxRange={f.maxRange}
                onMaxRangeChange={f.setMaxRange}
                damageTypes={f.damageTypes}
                onToggleDamageType={f.toggleDamageType}
                damageDiceType={f.damageDiceType}
                onDamageDiceTypeChange={f.setDamageDiceType}
                damageNumberOfDice={f.damageNumberOfDice}
                onDamageNumberOfDiceChange={f.setDamageNumberOfDice}
                damageTypesLayout="single-row"
              />
            </section>
          )}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-white/90">
              Equippable
            </h3>
            <ItemModalEquippableFields
              disabled={f.submitting}
              equippable={f.equippable}
              onEquippableChange={f.setEquippable}
              equipSlotTypes={f.equipSlotTypes}
              onToggleEquipSlot={f.toggleEquipSlot}
              equipSlotCost={f.equipSlotCost}
              onEquipSlotCostChange={f.setEquipSlotCost}
            />
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-white/90">
              Uses &amp; stat modifiers
            </h3>
            <ItemModalStatModifierFields
              fieldIdPrefix="custom-item"
              disabled={f.submitting}
              maxUses={f.maxUses}
              onMaxUsesChange={f.setMaxUses}
              modifiesAttribute={f.modifiesAttribute}
              onModifiesAttributeChange={f.setModifiesAttribute}
              attributeMod={f.attributeMod}
              onAttributeModChange={f.setAttributeMod}
              modifiesSkill={f.modifiesSkill}
              onModifiesSkillChange={f.setModifiesSkill}
              skillMod={f.skillMod}
              onSkillModChange={f.setSkillMod}
              isSpeedAltered={f.isSpeedAltered}
              onIsSpeedAlteredChange={f.setIsSpeedAltered}
            />
          </section>

          <ImageUploadDropzone
            id="custom-item-image"
            label="Image"
            imageKey={f.imageKey}
            onFileChange={(file) => void f.handleFile(file)}
            onDrop={f.handleDrop}
            onDragOver={f.handleDragOver}
            uploading={f.imageUpload.uploading}
            error={f.imageUpload.uploadError}
            disabled={f.submitting}
          />
        </GameFormModal>
      )}
    </GameFormModalDraftChrome>
  );
}
