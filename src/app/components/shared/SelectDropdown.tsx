"use client";

import Button from "@/app/components/shared/Button";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type SelectDropdownOption = {
  value: string;
  label: string;
  /** When true, option is visible but not selectable. */
  disabled?: boolean;
  /** Shown next to the label when disabled; defaults to “(already rolled)”. */
  disabledHint?: string;
};

export type SelectDropdownProps = {
  id: string;
  label: string;
  /** When false, label is visually hidden but kept for accessibility (paired with an external heading). */
  showLabel?: boolean;
  placeholder: string;
  value: string;
  options: SelectDropdownOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
  /**
   * When set (including `""`), the option with this `value` is listed first;
   * remaining options are sorted by label.
   */
  pinValueFirst?: string;
  /**
   * Extra control per option (e.g. info button). Receives `closeMenu` so the parent can dismiss the list first.
   * Clicks on the suffix do not select the option.
   */
  renderOptionSuffix?: (
    option: SelectDropdownOption,
    closeMenu: () => void
  ) => ReactNode;
};

export function SelectDropdown({
  id,
  label,
  showLabel = true,
  placeholder,
  value,
  options,
  disabled = false,
  onChange,
  pinValueFirst,
  renderOptionSuffix,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  const sortedOptions = useMemo(() => {
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
  }, [options, pinValueFirst]);

  const filteredOptions = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return sortedOptions;
    return sortedOptions.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [sortedOptions, filterQuery]);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => setFilterQuery(""));
    const focusTimer = setTimeout(() => filterInputRef.current?.focus(), 0);
    return () => clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (opt: SelectDropdownOption) => {
    onChange(opt.value);
    setOpen(false);
  };

  const closeMenu = () => setOpen(false);

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor={id}
        className={
          showLabel ? "mb-1 block text-sm font-bold text-black" : "sr-only"
        }
      >
        {label}
      </label>
      <Button
        id={id}
        variant="selectTriggerLight"
        fullWidth
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`${showLabel ? "mt-1" : ""} ${!selectedOption ? "text-black/60" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label`}
      >
        <span id={`${id}-label`} className="block truncate">
          {displayLabel}
        </span>
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/60"
          aria-hidden
        >
          {open ? "▲" : "▼"}
        </span>
      </Button>
      {open && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border-2 border-black/30 bg-paleBlue shadow-lg">
          <div className="sticky top-0 border-b border-black/20 bg-paleBlue p-1.5">
            <input
              ref={filterInputRef}
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Type to filter…"
              aria-label="Filter options"
              className="w-full rounded border border-black/30 px-2 py-1.5 text-sm text-black placeholder:text-black/50 focus:border-customPrimaryHover focus:outline-none focus-visible:ring-1 focus-visible:ring-customPrimaryHover"
            />
          </div>
          <ul
            role="listbox"
            aria-labelledby={`${id}-label`}
            className="max-h-44 overflow-y-auto py-1"
          >
            {filteredOptions.length === 0 ? (
              <li
                role="option"
                className="px-3 py-2 text-sm text-black/60"
                aria-selected={false}
              >
                {options.length === 0 ? "No options" : "No matches"}
              </li>
            ) : (
              filteredOptions.map((opt) => {
                const isDisabled = !!opt.disabled;
                const suffix =
                  renderOptionSuffix && !isDisabled
                    ? renderOptionSuffix(opt, closeMenu)
                    : null;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={value === opt.value}
                    aria-disabled={isDisabled}
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
                    tabIndex={isDisabled ? -1 : 0}
                    className={`flex min-h-[2.5rem] items-stretch gap-1 text-left text-sm transition-colors bg-paleBlue ${
                      isDisabled
                        ? "cursor-not-allowed text-black/40"
                        : `cursor-pointer hover:bg-paleBlueHover ${
                            value === opt.value
                              ? "bg-black/10 font-medium text-black"
                              : "text-black"
                          }`
                    }`}
                  >
                    <span className="min-w-0 flex-1 px-3 py-2">
                      {opt.label}
                      {isDisabled ? (
                        <span className="ml-2 text-[10px] font-normal uppercase tracking-wide text-black/40">
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
