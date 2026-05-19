"use client";

function ChevronIcon({ up }: { up: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 12 12"
      width={11}
      height={11}
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <path
        d={up ? "M3 7.5 6 4.5 9 7.5" : "M3 4.5 6 7.5 9 4.5"}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NumberFieldStepperRail({
  label,
  disabled = false,
  variant = "light",
  onBump,
}: {
  label: string;
  disabled?: boolean;
  variant?: "light" | "dark";
  onBump: (direction: 1 | -1) => void;
}) {
  const railClass =
    variant === "dark"
      ? "border-white/25 bg-black/25"
      : "border-black/15 bg-black/[0.04]";
  const buttonClass =
    variant === "dark"
      ? "text-white/75 hover:bg-paleBlue/15 hover:text-white focus-visible:outline-white/60"
      : "text-black/55 hover:bg-black/[0.06] hover:text-black focus-visible:outline-customPrimaryHover";

  return (
    <div
      className={
        `absolute inset-y-0 right-0 z-[1] flex w-8 flex-col border-l p-0.5 ${railClass} ` +
        (disabled ? "opacity-40" : "")
      }
    >
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label={`Increase ${label}`}
        className={`flex flex-1 items-center justify-center rounded-sm transition focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-2px] disabled:pointer-events-none ${buttonClass}`}
        onClick={() => onBump(1)}
      >
        <ChevronIcon up />
      </button>
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label={`Decrease ${label}`}
        className={`flex flex-1 items-center justify-center rounded-sm transition focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-2px] disabled:pointer-events-none ${buttonClass}`}
        onClick={() => onBump(-1)}
      >
        <ChevronIcon up={false} />
      </button>
    </div>
  );
}
