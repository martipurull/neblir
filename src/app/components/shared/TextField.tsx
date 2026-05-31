import {
  darkTextFieldClassName,
  darkTextFieldCompactClassName,
} from "@/app/components/shared/darkInputStyles";
import {
  sharedTextFieldClassName,
  sharedTextFieldCompactClassName,
} from "@/app/components/shared/inputStyles";
import { forwardRef } from "react";

type TextFieldVariant = "light" | "dark";
type TextFieldDensity = "default" | "compact";

function textFieldBaseClass(
  variant: TextFieldVariant,
  density: TextFieldDensity
): string {
  if (density === "compact") {
    return variant === "dark"
      ? darkTextFieldCompactClassName
      : sharedTextFieldCompactClassName;
  }
  return variant === "dark" ? darkTextFieldClassName : sharedTextFieldClassName;
}

export type TextFieldProps = Omit<
  React.ComponentPropsWithoutRef<"input">,
  "className"
> & {
  className?: string;
  variant?: TextFieldVariant;
  /** `compact` for menu filters and other tight single-line fields. */
  density?: TextFieldDensity;
};

/** Single-line input for light pages (`bg-paleBlue`) and dark game modals. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    { className = "", variant = "light", density = "default", ...props },
    ref
  ) {
    const baseClass = textFieldBaseClass(variant, density);
    return (
      <input
        ref={ref}
        className={`${baseClass} ${className}`.trim()}
        {...props}
      />
    );
  }
);
