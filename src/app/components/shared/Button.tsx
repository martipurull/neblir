import React, { forwardRef } from "react";
import {
  appButtonVariantClassName,
  type AppButtonVariant,
} from "./buttonStyles";

export type { AppButtonVariant };

export type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: AppButtonVariant;
  /** Kept for call sites that only pass a label string. */
  text?: string;
  /** Applies `w-full`. Defaults to true when `variant` is `primary`. */
  fullWidth?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    type = "button",
    text,
    children,
    fullWidth: fullWidthProp,
    className = "",
    disabled,
    ...rest
  },
  ref
) {
  const defaultFullWidth = variant === "primary";
  const fullWidth = fullWidthProp ?? defaultFullWidth;
  const base = appButtonVariantClassName[variant];
  const widthClass = fullWidth ? "w-full" : "";
  const content = children ?? text;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-disabled={disabled}
      className={`${base} ${widthClass} ${className}`.trim()}
      {...rest}
    >
      {content}
    </button>
  );
});

export default Button;
