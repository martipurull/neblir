"use client";

import { ImageUploadDropzone } from "@/app/components/games/shared/ImageUploadDropzone";
import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { modalInputClass } from "@/app/components/games/shared/modalStyles";
import { ItemModalEquippableFields } from "@/app/components/games/shared/ItemModalEquippableFields";
import { ItemModalWeaponFields } from "@/app/components/games/shared/ItemModalWeaponFields";
import { useCreateCustomItemModal } from "@/app/components/games/useCreateCustomItemModal";
import React from "react";

const ITEM_TYPES = [
  { value: "GENERAL_ITEM", label: "General item" },
  { value: "WEAPON", label: "Weapon" },
] as const;

type CreateCustomItemModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function CreateCustomItemModal({
  isOpen,
  gameId,
  gameName,
  onClose,
  onSuccess,
}: CreateCustomItemModalProps) {
  const f = useCreateCustomItemModal({ gameId, onClose, onSuccess });

  return (
    <GameFormModal
      isOpen={isOpen}
      title={`Create custom item — ${gameName}`}
      subtitle={
        <>
          Fields marked with <span className="text-neblirDanger-400">*</span>{" "}
          are required. Optional fields can be left blank.
        </>
      }
      titleId="create-custom-item-title"
      error={f.error}
      onClose={() => void f.handleClose()}
      onSubmit={(e) => void f.handleSubmit(e)}
      submitting={f.submitting}
      submitLabel="Create custom item"
      submittingLabel="Creating…"
    >
      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">Basics</h3>
        <div className="space-y-3">
          <div>
            <ModalFieldLabel id="custom-item-name" label="Name" required />
            <input
              id="custom-item-name"
              type="text"
              value={f.name}
              onChange={(e) => f.setName(e.target.value)}
              className={modalInputClass}
              placeholder="e.g. Combat knife"
              disabled={f.submitting}
            />
          </div>
          <div>
            <ModalFieldLabel id="custom-item-weight" label="Weight" required />
            <input
              id="custom-item-weight"
              type="number"
              min={0}
              step={0.1}
              value={f.weight}
              onChange={(e) => f.setWeight(e.target.value)}
              className={modalInputClass}
              placeholder="0"
              disabled={f.submitting}
            />
          </div>
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
        <div className="space-y-3">
          <div>
            <ModalFieldLabel id="custom-item-description" label="Description" />
            <textarea
              id="custom-item-description"
              value={f.description}
              onChange={(e) => f.setDescription(e.target.value)}
              className={modalInputClass + " min-h-[80px]"}
              placeholder="Item description"
              disabled={f.submitting}
              rows={3}
            />
          </div>
          <div>
            <ModalFieldLabel id="custom-item-usage" label="Usage" />
            <textarea
              id="custom-item-usage"
              value={f.usage}
              onChange={(e) => f.setUsage(e.target.value)}
              className={modalInputClass + " min-h-[80px]"}
              placeholder="e.g. One use per round"
              disabled={f.submitting}
              rows={3}
            />
          </div>
          <div>
            <ModalFieldLabel id="custom-item-notes" label="Notes" />
            <input
              id="custom-item-notes"
              type="text"
              value={f.notes}
              onChange={(e) => f.setNotes(e.target.value)}
              className={modalInputClass}
              placeholder="GM notes"
              disabled={f.submitting}
            />
          </div>
          <div>
            <ModalFieldLabel id="custom-item-cost-info" label="Cost info" />
            <input
              id="custom-item-cost-info"
              type="text"
              value={f.costInfo}
              onChange={(e) => f.setCostInfo(e.target.value)}
              className={modalInputClass}
              placeholder="e.g. Not for sale"
              disabled={f.submitting}
            />
          </div>
          <div>
            <ModalFieldLabel id="custom-item-conf-cost" label="Conf cost" />
            <input
              id="custom-item-conf-cost"
              type="number"
              min={0}
              value={f.confCost}
              onChange={(e) => f.setConfCost(e.target.value)}
              className={modalInputClass}
              placeholder="0"
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
        <h3 className="mb-3 text-sm font-semibold text-white/90">Equippable</h3>
        <ItemModalEquippableFields
          disabled={f.submitting}
          equippable={f.equippable}
          onEquippableChange={f.setEquippable}
          equipSlotTypes={f.equipSlotTypes}
          onToggleEquipSlot={f.toggleEquipSlot}
          equipSlotCost={f.equipSlotCost}
          onEquipSlotCostChange={f.setEquipSlotCost}
          maxUses={f.maxUses}
          onMaxUsesChange={f.setMaxUses}
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
  );
}
