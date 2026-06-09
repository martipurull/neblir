"use client";

import { ImageUploadDropzone } from "@/app/components/shared/ImageUploadDropzone";
import { GameFormModalDraftChrome } from "@/app/components/games/GameFormModalDraftChrome";
import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { UniqueItemModalOverridesSection } from "@/app/components/games/UniqueItemModalOverridesSection";
import { UniqueItemModalSourceSection } from "@/app/components/games/UniqueItemModalSourceSection";
import type { UniqueItemDraftScope } from "@/app/components/games/uniqueItemDraftStorage";
import { useCreateUniqueItemModal } from "@/app/components/games/useCreateUniqueItemModal";

type CreateUniqueItemModalProps = {
  isOpen: boolean;
  /**
   * Games whose custom items are listed when "Game custom item" is selected.
   * Can be empty (only global templates will be available).
   */
  customTemplateGameIds: string[];
  /** When set, create-mode form state persists in sessionStorage for this scope. */
  draftScope?: UniqueItemDraftScope;
  /**
   * If set, included as `gameId` on create (e.g. GM creating in a game).
   * Omit for character flow — the API derives game from the custom template when needed.
   */
  gameIdForSubmit?: string;
  /** Optional; shown after an em dash in the modal title (e.g. game name on GM page). */
  titleSuffix?: string;
  /** When set, modal loads that item and PATCHes on submit. */
  editUniqueItemId?: string | null;
  submitEndpoint?: string;
  noLinkedGameNotice?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function CreateUniqueItemModal({
  isOpen,
  customTemplateGameIds,
  draftScope,
  gameIdForSubmit,
  titleSuffix,
  editUniqueItemId = null,
  submitEndpoint,
  noLinkedGameNotice,
  onClose,
  onSuccess,
}: CreateUniqueItemModalProps) {
  const f = useCreateUniqueItemModal({
    isOpen,
    customTemplateGameIds,
    draftScope,
    gameIdForSubmit,
    editUniqueItemId,
    submitEndpoint,
    onClose,
    onSuccess,
  });
  const isEdit = Boolean(editUniqueItemId);

  return (
    <GameFormModalDraftChrome
      isOpen={isOpen}
      isEdit={isEdit}
      draftPersistenceEnabled={f.draftPersistenceEnabled}
      draftRestored={f.draftRestored}
      hasDiscardableDraft={f.hasDiscardableDraft}
      entityLabel="unique item"
      onDismiss={() => void f.handleClose()}
      onForceClose={() => void f.handleClose(true)}
      onDiscardAndClose={f.discardAndClose}
    >
      {({ onClose: dismiss, onCancel, cancelLabel, draftRestoredNotice }) => (
        <GameFormModal
          isOpen={isOpen}
          title={
            isEdit
              ? titleSuffix?.trim()
                ? `Edit unique item — ${titleSuffix.trim()}`
                : "Edit unique item"
              : titleSuffix?.trim()
                ? `Create unique item — ${titleSuffix.trim()}`
                : "Create unique item"
          }
          subtitle={
            f.sourceType === "STANDALONE"
              ? "Enter a name and weight, then add any extra details below — all fields except name and weight are optional."
              : "Choose a template (global catalog or a game’s custom item), then optionally set overrides. All override fields are optional."
          }
          titleId="create-unique-item-title"
          error={f.error}
          onClose={dismiss}
          onCancel={onCancel}
          onSubmit={(e) => void f.handleSubmit(e)}
          submitting={f.submitting}
          cancelLabel={cancelLabel}
          submitLabel={isEdit ? "Save changes" : "Create unique item"}
          submittingLabel={isEdit ? "Saving…" : "Creating…"}
          submitDisabled={f.submitDisabled}
        >
          {draftRestoredNotice}
          {noLinkedGameNotice && (
            <p className="mb-1 text-xs text-white/70">{noLinkedGameNotice}</p>
          )}
          <UniqueItemModalSourceSection f={f} />
          <UniqueItemModalOverridesSection f={f} />

          <ImageUploadDropzone
            id="unique-image-override"
            label="Image override"
            imageKey={f.imageKeyOverride}
            onFileChange={(file) => void f.handleImageFile(file)}
            onDrop={f.handleImageDrop}
            onDragOver={f.handleImageDragOver}
            uploading={f.imageUpload.uploading}
            error={f.imageUpload.uploadError}
            disabled={f.submitting}
          />
        </GameFormModal>
      )}
    </GameFormModalDraftChrome>
  );
}
