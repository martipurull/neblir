"use client";

import { Button } from "@/app/components/shared/Button";
import { RequiredMark } from "@/app/components/shared/FieldLabel";
import { TextField } from "@/app/components/shared/TextField";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type SelectDropdownOption<T extends string = string> = {
  value: T;
  label: string;
  /** When true, option is visible but not selectable. */
  disabled?: boolean;
  /** Shown next to the label when disabled; defaults to “(already rolled)”. */
  disabledHint?: string;
};

export type SelectDropdownSurface = "page" | "modal";

export type SelectDropdownProps<T extends string = string> = {
  id: string;
  label: string;
  /** When false, label is visually hidden but kept for accessibility (paired with an external heading). */
  showLabel?: boolean;
  /**
   * `page` is the pale field and the default. `modal` is the menu on a modal
   * shell. Both follow the document Theme. Callers pass a surface, not a Theme.
   */
  surface?: SelectDropdownSurface;
  /** Modal surface only. Shows the red required asterisk on the menu label. */
  required?: boolean;
  placeholder: string;
  value: T;
  options: SelectDropdownOption<T>[];
  disabled?: boolean;
  onChange: (value: T) => void;
  /**
   * When set (including `""`), the option with this `value` is listed first;
   * remaining options are sorted by label.
   */
  pinValueFirst?: T;
  /**
   * Extra control per option (e.g. info button). Receives `closeMenu` so the parent can dismiss the list first.
   * Clicks on the suffix do not select the option.
   */
  renderOptionSuffix?: (
    option: SelectDropdownOption<T>,
    closeMenu: () => void
  ) => ReactNode;
  /** Max height of the options list (scrolls inside). Taller values help in modals with long option sets. */
  menuMaxHeightClass?: string;
  /**
   * When false, options stay in the order passed. The default sorts by label
   * and keeps `pinValueFirst` at the top when that value is present.
   */
  sortOptions?: boolean;
  /** Fires when the list opens or closes. */
  onOpenChange?: (open: boolean) => void;
};

/** Room the open list wants before it should flip above the field. */
const MENU_PREFERRED_HEIGHT = 240;

function clippingBoundary(anchor: HTMLElement): DOMRect {
  let parent = anchor.parentElement;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (
      overflowY === "auto" ||
      overflowY === "hidden" ||
      overflowY === "scroll"
    ) {
      return parent.getBoundingClientRect();
    }
    parent = parent.parentElement;
  }
  return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
}

function menuOpensUp(anchor: HTMLElement): boolean {
  const rect = anchor.getBoundingClientRect();
  const boundary = clippingBoundary(anchor);
  const spaceBelow = boundary.bottom - rect.bottom;
  const spaceAbove = rect.top - boundary.top;
  if (spaceBelow >= MENU_PREFERRED_HEIGHT) return false;
  return spaceAbove > spaceBelow;
}

function selectOptionClassName(
  surface: SelectDropdownSurface,
  state: { disabled: boolean; selected: boolean; highlighted: boolean }
): string {
  const layout =
    "flex min-h-[2.5rem] items-stretch gap-1 text-left text-sm transition-colors";
  if (surface === "page") {
    if (state.disabled) {
      return `${layout} bg-paleBlue cursor-not-allowed text-black/40`;
    }
    const selected = state.selected ? "bg-black/10 font-medium" : "";
    const highlighted = state.highlighted
      ? `ring-2 ring-inset ring-customPrimaryHover ${
          state.selected ? "bg-black/10" : "bg-paleBlueHover"
        }`
      : "";
    return `${layout} bg-paleBlue cursor-pointer hover:bg-paleBlueHover text-black ${selected} ${highlighted}`;
  }
  if (state.disabled) {
    return `${layout} cursor-not-allowed bg-modalBackground-200 text-white/40`;
  }
  const selected = state.selected
    ? "bg-paleBlue/15 font-medium"
    : "bg-modalBackground-200";
  const highlighted = state.highlighted
    ? "ring-2 ring-inset ring-white/70"
    : "";
  return `${layout} cursor-pointer text-white hover:bg-paleBlue/20 ${selected} ${highlighted}`;
}

export function SelectDropdown<T extends string>({
  id,
  label,
  showLabel = true,
  surface = "page",
  required = false,
  placeholder,
  value,
  options,
  disabled = false,
  onChange,
  pinValueFirst,
  renderOptionSuffix,
  menuMaxHeightClass = "max-h-44",
  sortOptions = true,
  onOpenChange,
}: SelectDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [opensUp, setOpensUp] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  /** Index into `filteredOptions`; -1 = no row highlighted (focus stays in filter input). */
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  const sortedOptions = useMemo(() => {
    if (!sortOptions) return options;
    const copy = [...options];
    if (pinValueFirst === undefined) {
      return copy.sort((a, b) => a.label.localeCompare(b.label));
    }
    const pinIndex = copy.findIndex((o) => o.value === pinValueFirst);
    if (pinIndex === -1) {
      return copy.sort((a, b) => a.label.localeCompare(b.label));
    }
    const [pinned] = copy.splice(pinIndex, 1);
    copy.sort((a, b) => a.label.localeCompare(b.label));
    return [pinned, ...copy];
  }, [options, pinValueFirst, sortOptions]);

  const filteredOptions = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return sortedOptions;
    return sortedOptions.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [sortedOptions, filterQuery]);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setFilterQuery("");
      const first = sortedOptions.findIndex((o) => !o.disabled);
      setHighlightedIndex(first >= 0 ? first : -1);
    });
    const focusTimer = setTimeout(() => filterInputRef.current?.focus(), 0);
    return () => clearTimeout(focusTimer);
  }, [open, sortedOptions]);

  const handleFilterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextQuery = e.target.value;
    setFilterQuery(nextQuery);
    const q = nextQuery.trim().toLowerCase();
    const nextFiltered = !q
      ? sortedOptions
      : sortedOptions.filter((opt) => opt.label.toLowerCase().includes(q));
    const first = nextFiltered.findIndex((o) => !o.disabled);
    setHighlightedIndex(first >= 0 ? first : -1);
  };

  const findNextHighlight = useCallback(
    (current: number, dir: 1 | -1): number => {
      const opts = filteredOptions;
      const enabledIndices = opts
        .map((_, i) => i)
        .filter((i) => !opts[i].disabled);
      if (enabledIndices.length === 0) return -1;

      if (current === -1) {
        return dir === 1 ? enabledIndices[0] : -1;
      }

      const pos = enabledIndices.indexOf(current);
      if (pos === -1) return enabledIndices[0];

      if (dir === -1 && pos === 0) return -1;
      if (dir === -1) return enabledIndices[pos - 1];
      if (dir === 1 && pos === enabledIndices.length - 1)
        return enabledIndices[0];
      if (dir === 1) return enabledIndices[pos + 1];
      return current;
    },
    [filteredOptions]
  );

  const updateOpen = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  const openMenu = () => {
    const anchor = containerRef.current;
    if (anchor) setOpensUp(menuOpensUp(anchor));
    updateOpen(true);
  };

  useEffect(() => {
    if (!open || highlightedIndex < 0) return;
    const el = document.getElementById(`${id}-option-${highlightedIndex}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open, id]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        updateOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, updateOpen]);

  const handleSelect = (opt: SelectDropdownOption<T>) => {
    updateOpen(false);
    onChange(opt.value);
  };

  const handleFilterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      updateOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((h) => findNextHighlight(h, 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((h) => findNextHighlight(h, -1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const enabled = filteredOptions.filter((o) => !o.disabled);
      if (enabled.length === 0) return;
      const byHighlight =
        highlightedIndex >= 0 ? filteredOptions[highlightedIndex] : undefined;
      if (byHighlight && !byHighlight.disabled) {
        handleSelect(byHighlight);
        return;
      }
      if (enabled.length === 1) {
        handleSelect(enabled[0]);
      }
      return;
    }
  };

  const closeMenu = () => updateOpen(false);
  const modalSurface = surface === "modal";
  const labelClassName = showLabel
    ? modalSurface
      ? "block text-sm font-medium text-white/90"
      : "mb-1 block text-sm font-bold text-black"
    : "sr-only";
  const triggerClassName = [
    modalSurface || !showLabel ? "" : "mt-1",
    !selectedOption ? (modalSurface ? "text-white/60" : "text-black/60") : "",
  ]
    .filter((part) => part.length > 0)
    .join(" ");

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className={labelClassName}>
        {label}
        {required && modalSurface ? <RequiredMark /> : null}
      </label>
      <Button
        id={id}
        variant={modalSurface ? "selectTriggerModal" : "selectTriggerLight"}
        fullWidth
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (open) updateOpen(false);
          else openMenu();
        }}
        className={triggerClassName}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label`}
      >
        <span id={`${id}-label`} className="block truncate">
          {displayLabel}
        </span>
        <span
          className={
            modalSurface
              ? "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
              : "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/60"
          }
          aria-hidden
        >
          {open ? "▲" : "▼"}
        </span>
      </Button>
      {open && (
        <div
          className={[
            "absolute z-10 w-full overflow-hidden shadow-lg",
            opensUp ? "bottom-full mb-1" : "mt-1",
            modalSurface
              ? "rounded border-2 border-white/50 bg-modalBackground-200"
              : "rounded-md border-2 border-black/30 bg-paleBlue",
          ].join(" ")}
        >
          <div
            className={
              modalSurface
                ? "sticky top-0 border-b border-white/30 bg-modalBackground-200 p-1.5"
                : "sticky top-0 border-b border-black/20 bg-paleBlue p-1.5"
            }
          >
            <TextField
              ref={filterInputRef}
              type="text"
              variant={modalSurface ? "dark" : "light"}
              density="compact"
              value={filterQuery}
              onChange={handleFilterInputChange}
              onKeyDown={handleFilterKeyDown}
              placeholder="Type to filter…"
              aria-label="Filter options"
              aria-controls={`${id}-listbox`}
              aria-activedescendant={
                highlightedIndex >= 0
                  ? `${id}-option-${highlightedIndex}`
                  : undefined
              }
            />
          </div>
          <ul
            id={`${id}-listbox`}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className={`${menuMaxHeightClass} overflow-y-auto py-1`}
          >
            {filteredOptions.length === 0 ? (
              <li
                role="option"
                className={
                  modalSurface
                    ? "px-3 py-2 text-sm text-white/60"
                    : "px-3 py-2 text-sm text-black/60"
                }
                aria-selected={false}
              >
                {options.length === 0 ? "No options" : "No matches"}
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isDisabled = !!opt.disabled;
                const isHighlighted = !isDisabled && highlightedIndex === idx;
                const suffix =
                  renderOptionSuffix && !isDisabled
                    ? renderOptionSuffix(opt, closeMenu)
                    : null;
                return (
                  <li
                    key={opt.value}
                    id={`${id}-option-${idx}`}
                    role="option"
                    aria-selected={value === opt.value}
                    aria-disabled={isDisabled}
                    onMouseEnter={() => {
                      if (!isDisabled) setHighlightedIndex(idx);
                    }}
                    onClick={(e) => {
                      if (isDisabled) return;
                      if (
                        (e.target as HTMLElement).closest(
                          "[data-select-dropdown-suffix]"
                        )
                      ) {
                        return;
                      }
                      handleSelect(opt);
                    }}
                    onKeyDown={(e) => {
                      if (isDisabled) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect(opt);
                      }
                    }}
                    tabIndex={-1}
                    className={selectOptionClassName(surface, {
                      disabled: isDisabled,
                      selected: value === opt.value,
                      highlighted: isHighlighted,
                    })}
                  >
                    <span className="min-w-0 flex-1 px-3 py-2">
                      {opt.label}
                      {isDisabled ? (
                        <span
                          className={
                            modalSurface
                              ? "ml-2 text-[10px] font-normal uppercase tracking-wide text-white/40"
                              : "ml-2 text-[10px] font-normal uppercase tracking-wide text-black/40"
                          }
                        >
                          {opt.disabledHint ?? "(already rolled)"}
                        </span>
                      ) : null}
                    </span>
                    {suffix ? (
                      <span
                        data-select-dropdown-suffix
                        className="flex shrink-0 items-center pr-2"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        {suffix}
                      </span>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
