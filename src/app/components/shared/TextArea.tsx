import { sharedTextFieldClassName } from "@/app/components/shared/inputStyles";
import { forwardRef } from "react";

export type TextAreaProps = Omit<
  React.ComponentPropsWithoutRef<"textarea">,
  "className"
> & {
  className?: string;
};

/** Multi-line text control for light app surfaces (`bg-paleBlue`). */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ className = "", ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={`${sharedTextFieldClassName} ${className}`.trim()}
        {...props}
      />
    );
  }
);
