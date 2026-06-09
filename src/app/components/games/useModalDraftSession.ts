import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type UseModalDraftSessionArgs<T> = {
  enabled: boolean;
  isOpen: boolean;
  snapshot: T | null;
  isMeaningful: (draft: T) => boolean;
  readDraft: () => T | null;
  persistDraft: (draft: T) => void;
  clearDraft: () => void;
  applyDraft: (draft: T) => void;
  resetForm: () => void;
  deletePendingImage?: () => Promise<void>;
  onClose: () => void;
};

export function useModalDraftSession<T>({
  enabled,
  isOpen,
  snapshot,
  isMeaningful,
  readDraft,
  persistDraft,
  clearDraft,
  applyDraft,
  resetForm,
  deletePendingImage,
  onClose,
}: UseModalDraftSessionArgs<T>) {
  const [draftRestored, setDraftRestored] = useState(false);
  const [openSession, setOpenSession] = useState(0);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevEnabled, setPrevEnabled] = useState(enabled);
  const draftPersistEnabledRef = useRef(false);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen || !enabled) {
      setDraftRestored(false);
    } else {
      setOpenSession((session) => session + 1);
      setDraftRestored(false);
    }
  }

  if (enabled !== prevEnabled) {
    setPrevEnabled(enabled);
    if (!enabled) {
      setDraftRestored(false);
    } else if (isOpen) {
      setOpenSession((session) => session + 1);
      setDraftRestored(false);
    }
  }

  useLayoutEffect(() => {
    if (!isOpen || !enabled) {
      draftPersistEnabledRef.current = false;
      return;
    }

    draftPersistEnabledRef.current = false;
    const draft = readDraft();
    if (draft) {
      applyDraft(draft);
    }
    const restored = draft !== null;

    queueMicrotask(() => {
      setDraftRestored(restored);
      draftPersistEnabledRef.current = true;
    });
  }, [isOpen, enabled, openSession, readDraft, applyDraft]);

  useEffect(() => {
    if (!draftPersistEnabledRef.current || !enabled || snapshot === null)
      return;
    persistDraft(snapshot);
  }, [enabled, snapshot, persistDraft]);

  const hasDiscardableDraft = useMemo(
    () => snapshot !== null && isMeaningful(snapshot),
    [snapshot, isMeaningful]
  );

  const discardDraft = useCallback(async () => {
    if (!enabled) return;
    draftPersistEnabledRef.current = false;
    if (deletePendingImage) {
      await deletePendingImage();
    }
    clearDraft();
    setDraftRestored(false);
    resetForm();
  }, [enabled, deletePendingImage, clearDraft, resetForm]);

  const discardAndClose = useCallback(async () => {
    await discardDraft();
    onClose();
  }, [discardDraft, onClose]);

  const handleDismiss = useCallback(
    async (skipCleanup?: boolean) => {
      const keepDraftOnDismiss = !skipCleanup && enabled;

      if (!skipCleanup && deletePendingImage && !keepDraftOnDismiss) {
        await deletePendingImage();
      }

      if (!keepDraftOnDismiss) {
        resetForm();
      }

      onClose();
    },
    [enabled, deletePendingImage, resetForm, onClose]
  );

  return {
    draftRestored,
    draftPersistenceEnabled: enabled,
    hasDiscardableDraft,
    discardDraft,
    discardAndClose,
    handleDismiss,
    clearDraftOnSuccess: clearDraft,
    disableDraftPersist: useCallback(() => {
      draftPersistEnabledRef.current = false;
    }, []),
  };
}
