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
      <p className="text-sm text-red-600">Error: {message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
};

export default ErrorState;
