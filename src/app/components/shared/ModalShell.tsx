"use client";

import React from "react";
import Button from "./Button";

type ModalShellBase = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Pinned below the scroll region (e.g. Cancel / Submit). */
  footer?: React.ReactNode;
  zIndexClass?: string;
  maxWidthClass?: string;
  maxHeightClass?: string;
  panelClassName?: string;
  closeDisabled?: boolean;
  closeOnBackdrop?: boolean;
};

export type ModalShellProps = ModalShellBase &
  (
    | {
        title: React.ReactNode;
        titleId: string;
        subtitle?: React.ReactNode;
        ariaLabel?: undefined;
      }
    | {
        title?: undefined;
        titleId?: undefined;
        subtitle?: undefined;
        ariaLabel: string;
      }
  );

/**
 * Centered modal with a fixed header (title + close) and scrollable body so the × stays visible.
 */
export function ModalShell({
  isOpen,
  onClose,
  title,
  titleId,
  subtitle,
  ariaLabel,
  children,
  footer,
  zIndexClass = "z-50",
  maxWidthClass = "max-w-md",
  maxHeightClass = "max-h-[90vh]",
  panelClassName = "",
  closeDisabled = false,
  closeOnBackdrop = true,
}: ModalShellProps) {
  if (!isOpen) return null;

  const hasTitle = title != null && titleId != null;
  const labelledBy = hasTitle ? titleId : undefined;

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/40 px-4 py-6`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={!hasTitle ? ariaLabel : undefined}
      onClick={
        closeOnBackdrop && !closeDisabled
          ? () => {
              onClose();
            }
          : undefined
      }
    >
      <div
        className={`flex ${maxHeightClass} w-full ${maxWidthClass} flex-col overflow-hidden rounded-lg border-2 border-white bg-modalBackground-200 shadow-lg ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/20 px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
          <div className="min-w-0 flex-1">
            {hasTitle && titleId ? (
              <h2 id={titleId} className="text-lg font-semibold text-white">
                {title}
              </h2>
            ) : null}
            {subtitle != null ? (
              <p className="mt-1 text-sm text-white/80">{subtitle}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="modalClose"
            fullWidth={false}
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
          {children}
        </div>

        {footer != null ? (
          <div className="shrink-0 border-t border-white/20 px-4 py-4 sm:px-5 sm:py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
