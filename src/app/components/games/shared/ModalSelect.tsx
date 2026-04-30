"use client";

import Button from "@/app/components/shared/Button";
import { useRef, useEffect, useState, useMemo } from "react";
export type ModalSelectOption = { value: string; label: string };

export type ModalSelectProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: ModalSelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

const filterInputClass =
  "w-full rounded border border-white/40 bg-paleBlue/10 px-2 py-1.5 text-sm text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-1 focus:ring-white";

export function ModalSelect({
  id,
  label,
  placeholder,
  value,
  options,
  disabled = false,
  onChange,
}: ModalSelectProps) {
  const [open, setOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.label.localeCompare(b.label)),
    [options]
  );

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

  const handleSelect = (opt: ModalSelectOption) => {
    onChange(opt.value);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-white/90">
        {label}
      </label>
      <Button
        id={id}
        variant="selectTriggerModal"
        fullWidth
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={!selectedOption ? "text-white/60" : ""}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label`}
      >
        <span id={`${id}-label`} className="block truncate">
          {displayLabel}
        </span>
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
          aria-hidden
        >
          {open ? "▲" : "▼"}
        </span>
      </Button>
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded border-2 border-white/50 bg-modalBackground-200 shadow-lg overflow-hidden">
          <div className="sticky top-0 border-b border-white/30 bg-modalBackground-200 p-1.5">
            <input
              ref={filterInputRef}
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Type to filter…"
              aria-label="Filter options"
              className={filterInputClass}
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
                className="px-3 py-2 text-sm text-white/60"
                aria-selected={false}
              >
                {options.length === 0 ? "No options" : "No matches"}
              </li>
            ) : (
              filteredOptions.map((opt) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={value === opt.value}
                  onClick={() => handleSelect(opt)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(opt);
                    }
                  }}
                  tabIndex={0}
                  className={`cursor-pointer px-3 py-2.5 text-left text-sm text-black transition-colors hover:bg-paleBlue/20 ${
                    value === opt.value
                      ? "bg-paleBlue/15 font-medium"
                      : "bg-modalBackground-200"
                  }`}
                >
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
