import React from "react";

interface DangerButtonProps {
  text: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const DangerButton: React.FC<DangerButtonProps> = ({
  text,
  type = "button",
  onClick,
  disabled = false,
  className = "",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border-2 border-neblirDanger-200 bg-neblirDanger-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neblirDanger-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
    >
      {text}
    </button>
  );
};

export default DangerButton;
