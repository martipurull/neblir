import { Checkbox } from "@/app/components/shared/Checkbox";

type PrivateRollCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function PrivateRollCheckbox({
  checked,
  onChange,
}: PrivateRollCheckboxProps) {
  return (
    <div className="rounded border border-white/15 bg-black/10 p-3">
      <Checkbox
        checked={checked}
        onChange={onChange}
        tone="inverse"
        label={
          <span className="text-white/90">
            Private roll (hide character and roll details on Discord)
          </span>
        }
      />
    </div>
  );
}
