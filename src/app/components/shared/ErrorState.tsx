import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import React from "react";
import Button from "./Button";

interface ErrorStateProps {
  message: string;
  retryLabel?: string;
  onRetry?: () => void | Promise<void>;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  retryLabel = "Retry",
  onRetry,
}) => {
  const safeMessage = getUserSafeErrorMessage(message);
  return (
    <div className="space-y-3">
      <p className="break-words text-sm text-neblirDanger-600">
        Error: {safeMessage}
      </p>
      {onRetry && (
        <Button
          type="button"
          variant="quiet"
          fullWidth={false}
          onClick={() => {
            void onRetry?.();
          }}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
