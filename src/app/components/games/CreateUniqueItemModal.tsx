"use client";

import { ImageUploadDropzone } from "@/app/components/games/shared/ImageUploadDropzone";
import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { UniqueItemModalOverridesSection } from "@/app/components/games/UniqueItemModalOverridesSection";
import { UniqueItemModalSourceSection } from "@/app/components/games/UniqueItemModalSourceSection";
import { useCreateUniqueItemModal } from "@/app/components/games/useCreateUniqueItemModal";
type CreateUniqueItemModalProps = {
  isOpen: boolean;
  /**
   * Games whose custom items are listed when "Game custom item" is selected.
   * Can be empty (only global templates will be available).
   */
  customTemplateGameIds: string[];
  /**
   * If set, included as `gameId` on create (e.g. GM creating in a game).
   * Omit for character flow — the API derives game from the custom template when needed.
   */
  gameIdForSubmit?: string;
  /** Optional; shown after an em dash in the modal title (e.g. game name on GM page). */
  titleSuffix?: string;
  submitEndpoint?: string;
  noLinkedGameNotice?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function CreateUniqueItemModal({
  isOpen,
  customTemplateGameIds,
  gameIdForSubmit,
  titleSuffix,
  submitEndpoint,
  noLinkedGameNotice,
  onClose,
  onSuccess,
}: CreateUniqueItemModalProps) {
  const f = useCreateUniqueItemModal({
    isOpen,
    customTemplateGameIds,
    gameIdForSubmit,
    submitEndpoint,
    onClose,
    onSuccess,
  });

  return (
    <GameFormModal
      isOpen={isOpen}
      title={
        titleSuffix?.trim()
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
      onClose={() => void f.handleClose()}
      onSubmit={(e) => void f.handleSubmit(e)}
      submitting={f.submitting}
      submitLabel="Create unique item"
      submittingLabel="Creating…"
      submitDisabled={f.submitDisabled}
    >
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
  );
}
