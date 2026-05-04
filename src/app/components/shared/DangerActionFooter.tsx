"use client";

import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import React, { useState } from "react";
import Button from "./Button";
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
        getUserSafeErrorMessage(error, "Failed to complete action")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`mt-auto flex items-center justify-between border-t border-black pt-6 ${className}`.trim()}
      >
        <FootnoteText className="pr-8">{note}</FootnoteText>
        <Button
          variant="danger"
          fullWidth={false}
          onClick={openModal}
          disabled={!onConfirm}
        >
          {actionLabel}
        </Button>
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
