"use client";
type RadioOption = {
  value: string;
  label: string;
};

interface RadioGroupProps {
  name: string;
  label?: string;
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  tone?: "default" | "inverse";
  variant?: "boxed" | "chip";
  /** Chip layout: equal-width boxes in a responsive grid (settings-style pickers). */
  optionLayout?: "inline" | "equal";
  density?: "default" | "compact";
}

export function RadioGroup({
  name,
  label,
  value,
  options,
  onChange,
  disabled = false,
  tone = "default",
  variant = "boxed",
  optionLayout = "inline",
  density = "default",
}: RadioGroupProps) {
  const selectedClass =
    tone === "inverse"
      ? "border-white bg-paleBlue/20 text-white"
      : variant === "chip"
        ? "border-customPrimary bg-customPrimary text-customSecondary ring-2 ring-paleBlue ring-offset-2"
        : "border-customPrimary bg-customPrimary text-customSecondary";
  const unselectedClass =
    tone === "inverse"
      ? "border-white/30 bg-transparent text-white hover:border-white/50"
      : variant === "chip"
        ? "border-black/25 bg-paleBlue text-black hover:border-black/40"
        : "border-customPrimary bg-transparent text-black hover:border-black/50";
  const baseShape =
    variant === "chip"
      ? density === "compact"
        ? "rounded px-2 py-1 text-xs"
        : "rounded-md px-3 py-2.5"
      : "rounded-md min-h-11 px-3 py-2";
  const hideNativeControl = variant === "chip";
  const optionsContainerClass =
    optionLayout === "equal"
      ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
      : density === "compact"
        ? "flex flex-wrap gap-2"
        : "flex flex-wrap gap-3 lg:justify-center";
  const labelMinHeightClass =
    optionLayout === "equal"
      ? density === "compact"
        ? "min-h-8"
        : "min-h-11"
      : "";
  const labelTextClass = density === "compact" ? "text-xs" : "text-sm";

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      {label ? (
        <legend
          className={`mb-1 block text-sm font-bold ${
            optionLayout === "equal" ? "text-black" : "lg:text-center"
          } ${tone === "inverse" ? "text-white" : "text-black"}`}
        >
          {label}
        </legend>
      ) : null}
      <div className={optionsContainerClass}>
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={`${
                optionLayout === "equal"
                  ? `flex w-full ${labelMinHeightClass} items-center justify-center text-center`
                  : "inline-flex items-center"
              } gap-2 border-2 ${labelTextClass} font-medium transition-colors ${
                checked ? selectedClass : unselectedClass
              } ${baseShape} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className={`${hideNativeControl ? "sr-only" : "h-4 w-4"} accent-customPrimary`}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
