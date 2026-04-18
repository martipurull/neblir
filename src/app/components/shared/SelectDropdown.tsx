"use client";

import Button from "@/app/components/shared/Button";
import React, {
  useCallback,
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
  /** Index into `filteredOptions`; -1 = no row highlighted (focus stays in filter input). */
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
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

  const handleFilterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
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
              className="w-full rounded border border-black/30 px-2 py-1.5 text-sm text-black placeholder:text-black/50 focus:border-customPrimaryHover focus:outline-none focus-visible:ring-1 focus-visible:ring-customPrimaryHover"
            />
          </div>
          <ul
            id={`${id}-listbox`}
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
                    className={`flex min-h-[2.5rem] items-stretch gap-1 text-left text-sm transition-colors bg-paleBlue ${
                      isDisabled
                        ? "cursor-not-allowed text-black/40"
                        : `cursor-pointer hover:bg-paleBlueHover text-black ${
                            value === opt.value ? "bg-black/10 font-medium" : ""
                          } ${
                            isHighlighted
                              ? "ring-2 ring-inset ring-customPrimaryHover " +
                                (value === opt.value
                                  ? "bg-black/10"
                                  : "bg-paleBlueHover")
                              : ""
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
