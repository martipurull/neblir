"use client";

import React, { useRef, useEffect, useLayoutEffect, useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (number | null)[] = [];
  // Monday = 0 (getDay() 1), so offset is getDay() - 1, or 0 for Sunday -> 6
  const startOffset = (first.getDay() + 6) % 7;
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  return days;
}

export type ThemedDatePickerProps = {
  value: string; // YYYY-MM-DD or ""
  onChange: (dateString: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  placeholder?: string;
};

export function ThemedDatePicker({
  value,
  onChange,
  disabled = false,
  ariaLabel = "Choose date",
  placeholder = "Set date",
}: ThemedDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  const displayLabel = value
    ? (() => {
        const [y, m, d] = value.split("-").map(Number);
        return `${d} ${MONTHS[m - 1]} ${y}`;
      })()
    : placeholder;

  useLayoutEffect(() => {
    if (!value) return;
    const [y, m] = value.split("-").map(Number);
    queueMicrotask(() => {
      setViewYear(y);
      setViewMonth(m - 1);
    });
  }, [value]);

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

  const days = getDaysInMonth(viewYear, viewMonth);

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelect = (day: number) => {
    const y = viewYear;
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  };

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="min-w-[10rem] rounded border border-black/20 bg-paleBlue px-3 py-2 text-left text-sm text-black placeholder:text-black/50 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-paleBlue/60 disabled:text-black/60"
      >
        {displayLabel}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Calendar"
          className="absolute left-0 top-full z-20 mt-1 min-w-[280px] max-w-[calc(100vw-2rem)] rounded-lg border-2 border-white bg-modalBackground-200 p-3 shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous month"
              className="rounded p-1.5 text-white/80 hover:bg-paleBlue/10"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-white">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next month"
              className="rounded p-1.5 text-white/80 hover:bg-paleBlue/10"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="min-w-[2rem] py-1 text-xs font-medium text-white/70"
              >
                {w}
              </div>
            ))}
            {days.map((day, i) =>
              day === null ? (
                <div key={`empty-${i}`} className="min-w-[2rem] py-1" />
              ) : (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={`min-w-[2rem] rounded py-2 text-sm transition-colors ${
                    viewYear === todayY &&
                    viewMonth === todayM &&
                    day === todayD
                      ? "bg-paleBlue/20 font-medium text-white"
                      : "text-white hover:bg-paleBlue/10"
                  }`}
                >
                  {day}
                </button>
              )
            )}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="mt-3 w-full rounded border border-white/40 py-2 text-xs text-white/80 hover:bg-paleBlue/10"
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}
