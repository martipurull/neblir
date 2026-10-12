import { darkSelectClassName } from "@/app/components/shared/darkInputStyles";
import { sharedSelectClassName } from "@/app/components/shared/inputStyles";

type SelectFieldOption<T extends string = string> = {
  value: T;
  label: string;
};

type SelectFieldProps<T extends string> = {
  id: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectFieldOption<T>[];
  disabled?: boolean;
  variant?: "light" | "dark";
};

/** Unlabeled native list. The label stays outside. Options render in the order given. */
export function SelectField<T extends string>({
  id,
  value,
  onChange,
  options,
  disabled = false,
  variant = "light",
}: SelectFieldProps<T>) {
  const className =
    variant === "dark" ? darkSelectClassName : sharedSelectClassName;

  return (
    <select
      id={id}
      className={className}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
