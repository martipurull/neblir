"use client";

import { Button } from "@/app/components/shared/Button";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type ExpandableClampProps = {
  children: ReactNode;
  contentClassName?: string;
  /** Tailwind classes applied when collapsed (e.g. line-clamp-3 or max-h-12 overflow-hidden). */
  clampClassName?: string;
  buttonClassName?: string;
  /** Re-run overflow detection when this value changes. */
  measureKey?: string | number;
};

export function ExpandableClamp({
  children,
  contentClassName,
  clampClassName = "line-clamp-3",
  buttonClassName = "mt-1",
  measureKey,
}: ExpandableClampProps) {
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (expanded) return;
    const el = contentRef.current;
    if (!el) return;

    const update = () => {
      setHasOverflow(el.scrollHeight > el.clientHeight + 1);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded, measureKey]);

  const showToggle = hasOverflow || expanded;

  return (
    <div>
      <div
        ref={contentRef}
        className={[contentClassName, expanded ? "" : clampClassName]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
      {showToggle ? (
        <Button
          type="button"
          variant="lightLinkSubtle"
          fullWidth={false}
          className={buttonClassName}
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((value) => !value);
          }}
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      ) : null}
    </div>
  );
}
