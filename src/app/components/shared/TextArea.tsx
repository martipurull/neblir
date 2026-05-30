import { modalInputClass } from "@/app/components/games/shared/modalStyles";
import { sharedTextFieldClassName } from "@/app/components/shared/inputStyles";
import { forwardRef } from "react";

type TextAreaVariant = "light" | "dark";

export type TextAreaProps = Omit<
  React.ComponentPropsWithoutRef<"textarea">,
  "className"
> & {
  className?: string;
  variant?: TextAreaVariant;
};

/** Multi-line text control for light pages (`bg-paleBlue`) and dark game modals. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ className = "", variant = "light", ...props }, ref) {
    const baseClass =
      variant === "dark" ? modalInputClass : sharedTextFieldClassName;
    return (
      <textarea
        ref={ref}
        className={`${baseClass} ${className}`.trim()}
        {...props}
      />
    );
  }
);
