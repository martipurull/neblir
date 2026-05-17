import { sharedTextFieldClassName } from "@/app/components/shared/inputStyles";
import { forwardRef } from "react";

export type TextFieldProps = Omit<
  React.ComponentPropsWithoutRef<"input">,
  "className"
> & {
  className?: string;
};

/** Single-line text/number/etc. input for light app surfaces (`bg-paleBlue`). */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`${sharedTextFieldClassName} ${className}`.trim()}
        {...props}
      />
    );
  }
);
