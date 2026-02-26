"use client";

import React, { useState } from "react";
import DangerButton from "./DangerButton";
import DangerConfirmModal from "./DangerConfirmModal";
import FootnoteText from "./FootnoteText";

interface DangerActionFooterProps {
  note: React.ReactNode;
  actionLabel: string;
  confirmTitle?: string;
  confirmDescription?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  className?: string;
}

const DangerActionFooter: React.FC<DangerActionFooterProps> = ({
  note,
  actionLabel,
  confirmTitle = "Confirm destructive action",
  confirmDescription = "This action is permanent and cannot be undone.",
  confirmLabel = actionLabel,
  cancelLabel = "Cancel",
  onConfirm,
  className = "",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openModal = () => {
    if (!onConfirm) {
      return;
    }
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }
    setIsModalOpen(false);
  };

  const handleConfirm = async () => {
    if (!onConfirm) {
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onConfirm();
      setIsModalOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to complete action"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`mt-auto flex items-center justify-between border-t border-gray-200 pt-6 ${className}`.trim()}
      >
        <FootnoteText className="pr-8">{note}</FootnoteText>
        <DangerButton
          text={actionLabel}
          onClick={openModal}
          disabled={!onConfirm}
        />
      </div>
      <DangerConfirmModal
        isOpen={isModalOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onCancel={closeModal}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default DangerActionFooter;
