import React, { forwardRef } from "react";

export type DangerButtonProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "children"
> & {
  /** Label text (omit when using `children`, e.g. an icon). */
  text?: string;
  children?: React.ReactNode;
};

const DangerButton = forwardRef<HTMLButtonElement, DangerButtonProps>(
  function DangerButton(
    {
      text,
      children,
      type = "button",
      className = "",
      disabled = false,
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`rounded-md border-2 border-neblirDanger-200 bg-neblirDanger-600 px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-neblirDanger-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
        {...rest}
      >
        {children ?? text}
      </button>
    );
  }
);

export default DangerButton;
