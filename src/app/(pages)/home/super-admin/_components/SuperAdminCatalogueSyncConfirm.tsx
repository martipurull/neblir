import { DangerConfirmModal } from "@/app/components/shared/DangerConfirmModal";
import { TypeToConfirmDangerModal } from "@/app/components/shared/TypeToConfirmDangerModal";

export function SuperAdminCatalogueSyncConfirm({
  productionDest,
  destinationName,
  confirmCopy,
  isOpen,
  isApplying,
  errorMessage,
  onCancel,
  onConfirm,
}: {
  productionDest: boolean;
  destinationName: string;
  confirmCopy: string;
  isOpen: boolean;
  isApplying: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const shared = {
    isOpen,
    description: confirmCopy,
    confirmLabel: "Apply overlay",
    confirmSubmittingLabel: "Applying…",
    cancelLabel: "Cancel",
    isSubmitting: isApplying,
    errorMessage,
    variant: "modalBackground" as const,
    onCancel,
    onConfirm,
  };

  if (productionDest) {
    return (
      <TypeToConfirmDangerModal
        {...shared}
        title={`Apply Official overlay onto ${destinationName}?`}
        requiredPhrase={destinationName}
      />
    );
  }

  return <DangerConfirmModal {...shared} title="Apply Official overlay?" />;
}
