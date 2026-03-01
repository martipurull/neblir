import React from "react";

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
  return (
    <div className="space-y-3">
      <p className="text-sm text-neblirDanger-600">Error: {message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-black bg-transparent px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-black/10"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
};

export default ErrorState;
