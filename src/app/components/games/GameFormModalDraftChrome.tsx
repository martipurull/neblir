"use client";

import { DangerConfirmModal } from "@/app/components/shared/DangerConfirmModal";
import { useState, type ReactNode } from "react";

type GameFormModalDraftChromeProps = {
  isOpen: boolean;
  isEdit: boolean;
  draftPersistenceEnabled: boolean;
  draftRestored: boolean;
  hasDiscardableDraft: boolean;
  entityLabel: string;
  onDismiss: () => void;
  onForceClose: () => void;
  onDiscardAndClose: () => Promise<void>;
  children: (handlers: {
    onClose: () => void;
    onCancel?: () => void;
    cancelLabel: string;
    draftRestoredNotice: ReactNode;
  }) => ReactNode;
};

export function GameFormModalDraftChrome({
  isOpen,
  isEdit,
  draftPersistenceEnabled,
  draftRestored,
  hasDiscardableDraft,
  entityLabel,
  onDismiss,
  onForceClose,
  onDiscardAndClose,
  children,
}: GameFormModalDraftChromeProps) {
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    setDiscardConfirmOpen(false);
  }
  const useDiscardFlow = draftPersistenceEnabled && !isEdit;

  const handleCancel = () => {
    if (useDiscardFlow && hasDiscardableDraft) {
      setDiscardConfirmOpen(true);
      return;
    }
    onForceClose();
  };

  const draftRestoredNotice =
    draftRestored && useDiscardFlow ? (
      <p className="mb-1 text-xs text-white/70">
        Restored your in-progress draft. Close the modal anytime to keep working
        on it later, or use Discard to clear it.
      </p>
    ) : null;

  return (
    <>
      {children({
        onClose: onDismiss,
        onCancel: useDiscardFlow ? handleCancel : undefined,
        cancelLabel: useDiscardFlow ? "Discard" : "Cancel",
        draftRestoredNotice,
      })}

      <DangerConfirmModal
        isOpen={discardConfirmOpen}
        title="Discard this draft?"
        description={`Your in-progress ${entityLabel} will be cleared. This cannot be undone.`}
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        confirmSubmittingLabel="Discarding…"
        onCancel={() => setDiscardConfirmOpen(false)}
        onConfirm={async () => {
          await onDiscardAndClose();
          setDiscardConfirmOpen(false);
        }}
        variant="modalBackground"
      />
    </>
  );
}
