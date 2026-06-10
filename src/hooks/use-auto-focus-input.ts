import { useLayoutEffect, type RefObject } from "react";

/** Focus and select an input when `active` becomes true (e.g. modal open, row mount). */
export function useAutoFocusInput(
  ref: RefObject<HTMLInputElement | null>,
  active: boolean,
  onComplete?: () => void
): void {
  useLayoutEffect(() => {
    if (!active || !ref.current) return;
    ref.current.focus();
    ref.current.select();
    onComplete?.();
  }, [active, onComplete, ref]);
}
