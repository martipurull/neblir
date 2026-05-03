"use client";

import { ImageUploadDropzone } from "@/app/components/games/shared/ImageUploadDropzone";
import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { GameModalRichTextField } from "@/app/components/games/shared/GameModalRichTextField";
import { ModalDamageTypeCheckboxGrid } from "@/app/components/games/shared/ModalDamageTypeCheckboxGrid";
import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { modalInputClass } from "@/app/components/games/shared/modalStyles";
import { CustomEnemyActionListEditor } from "@/app/components/games/CustomEnemyActionListEditor";
import { useCreateCustomEnemyModal } from "@/app/components/games/useCreateCustomEnemyModal";

type CreateCustomEnemyModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  /** When set, modal loads that enemy and PATCHes on submit. */
  editCustomEnemyId?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function CreateCustomEnemyModal({
  isOpen,
  gameId,
  gameName,
  editCustomEnemyId = null,
  onClose,
  onSuccess,
}: CreateCustomEnemyModalProps) {
  const f = useCreateCustomEnemyModal({
    gameId,
    isOpen,
    editCustomEnemyId,
    onClose,
    onSuccess,
  });
  const isEdit = Boolean(editCustomEnemyId);
  return (
    <GameFormModal
      isOpen={isOpen}
      title={
        isEdit
          ? `Edit custom enemy — ${gameName}`
          : `Create custom enemy — ${gameName}`
      }
      subtitle={
        <>
          Fields marked with <span className="text-neblirDanger-400">*</span>{" "}
          are required. Description and notes support rich text. Defence and
          attack modifiers can be left blank (they default to 0).
        </>
      }
      titleId="create-custom-enemy-title"
      error={f.error}
      onClose={() => void f.handleClose()}
      onSubmit={(e) => void f.handleSubmit(e)}
      submitting={f.submitting}
      submitLabel={isEdit ? "Save changes" : "Create custom enemy"}
      submittingLabel={isEdit ? "Saving…" : "Creating…"}
    >
      <section className="space-y-3">
        <div>
          <ModalFieldLabel id="custom-enemy-name" label="Name" required />
          <input
            id="custom-enemy-name"
            type="text"
            value={f.name}
            onChange={(e) => f.setName(e.target.value)}
            className={modalInputClass}
            disabled={f.submitting}
          />
        </div>
        <ImageUploadDropzone
          id="custom-enemy-image"
          label="Image"
          imageKey={f.imageKey}
          onFileChange={(file) => void f.handleFile(file)}
          onDrop={f.handleDrop}
          onDragOver={f.handleDragOver}
          uploading={f.imageUpload.uploading}
          error={f.imageUpload.uploadError}
          disabled={f.submitting}
        />
        <GameModalRichTextField
          id="custom-enemy-description"
          label="Description"
          value={f.description}
          onChange={f.setDescription}
          disabled={f.submitting}
          syncKey={f.richTextSyncKey}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-white/90">
          Immunities, resistances &amp; vulnerabilities
        </h3>
        <p className="text-xs text-white/55">
          Toggle damage types this enemy ignores, takes half from, or takes
          extra from.
        </p>
        <ModalDamageTypeCheckboxGrid
          idPrefix="custom-enemy-immune"
          sectionTitle="Immunities"
          selected={f.immunities}
          onToggle={f.toggleImmunity}
          disabled={f.submitting}
        />
        <ModalDamageTypeCheckboxGrid
          idPrefix="custom-enemy-resist"
          sectionTitle="Resistances"
          selected={f.resistances}
          onToggle={f.toggleResistance}
          disabled={f.submitting}
        />
        <ModalDamageTypeCheckboxGrid
          idPrefix="custom-enemy-vuln"
          sectionTitle="Vulnerabilities"
          selected={f.vulnerabilities}
          onToggle={f.toggleVulnerability}
          disabled={f.submitting}
        />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">Core stats</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ModalNumberField
            id="custom-enemy-health"
            label="Health"
            value={f.health}
            onChange={f.setHealth}
            disabled={f.submitting}
          />
          <ModalNumberField
            id="custom-enemy-speed"
            label="Speed (metres per turn)"
            value={f.speed}
            onChange={f.setSpeed}
            disabled={f.submitting}
          />
          <ModalNumberField
            id="custom-enemy-initiative"
            label="Initiative modifier"
            value={f.initiativeModifier}
            onChange={f.setInitiativeModifier}
            disabled={f.submitting}
          />
          <ModalNumberField
            id="custom-enemy-number-of-reactions"
            label="Number of reactions"
            value={f.numberOfReactions}
            onChange={f.setNumberOfReactions}
            disabled={f.submitting}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">Defence</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ModalNumberField
            id="custom-enemy-defence-melee"
            label="Defence melee"
            value={f.defenceMelee}
            onChange={f.setDefenceMelee}
            disabled={f.submitting}
            required={false}
          />
          <ModalNumberField
            id="custom-enemy-defence-range"
            label="Defence range"
            value={f.defenceRange}
            onChange={f.setDefenceRange}
            disabled={f.submitting}
            required={false}
          />
          <ModalNumberField
            id="custom-enemy-defence-grid"
            label="Defence grid"
            value={f.defenceGrid}
            onChange={f.setDefenceGrid}
            disabled={f.submitting}
            required={false}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">Attack</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ModalNumberField
            id="custom-enemy-attack-melee"
            label="Attack melee"
            value={f.attackMelee}
            onChange={f.setAttackMelee}
            disabled={f.submitting}
            required={false}
          />
          <ModalNumberField
            id="custom-enemy-attack-range"
            label="Attack range"
            value={f.attackRange}
            onChange={f.setAttackRange}
            disabled={f.submitting}
            required={false}
          />
          <ModalNumberField
            id="custom-enemy-attack-throw"
            label="Attack throw"
            value={f.attackThrow}
            onChange={f.setAttackThrow}
            disabled={f.submitting}
            required={false}
          />
          <ModalNumberField
            id="custom-enemy-attack-grid"
            label="Attack grid"
            value={f.attackGrid}
            onChange={f.setAttackGrid}
            disabled={f.submitting}
            required={false}
          />
        </div>
      </section>

      <CustomEnemyActionListEditor
        which="actions"
        title="Actions"
        hint="Main attacks and abilities. Leave a row blank (no name) and it will be ignored."
        rows={f.actions}
        disabled={f.submitting}
        onAdd={() => f.addActionRow("actions")}
        onRemove={(id) => f.removeActionRow("actions", id)}
        onChange={(clientId, field, value) =>
          f.updateActionField("actions", clientId, field, value)
        }
      />

      <CustomEnemyActionListEditor
        which="additionalActions"
        title="Additional actions"
        hint="Extra options (e.g. bonus attacks). Blank rows are ignored."
        rows={f.additionalActions}
        disabled={f.submitting}
        onAdd={() => f.addActionRow("additionalActions")}
        onRemove={(id) => f.removeActionRow("additionalActions", id)}
        onChange={(clientId, field, value) =>
          f.updateActionField("additionalActions", clientId, field, value)
        }
      />

      <GameModalRichTextField
        id="custom-enemy-notes"
        label="Notes"
        value={f.notes}
        onChange={f.setNotes}
        disabled={f.submitting}
        syncKey={f.richTextSyncKey}
      />
    </GameFormModal>
  );
}
