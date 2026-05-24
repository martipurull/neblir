import type { SelectDropdownOption } from "@/app/components/shared/SelectDropdown";
import { PathName } from "@prisma/client";

const ALL_PATH_NAMES = Object.values(PathName).filter(
  (v): v is PathName => typeof v === "string"
);

function pathNameToOption(value: PathName): SelectDropdownOption {
  return {
    value,
    label: value.replaceAll("_", " "),
  };
}

/** Every `PathName` enum value (e.g. feature form — paths must already exist in DB). */
export const PATH_NAME_SELECT_OPTIONS: SelectDropdownOption[] = [
  ...ALL_PATH_NAMES,
]
  .sort((a, b) => a.localeCompare(b))
  .map(pathNameToOption);

/** Enum values with no `Path` row yet (super-admin create path form). */
export function buildAvailablePathNameSelectOptions(
  usedNames: Iterable<PathName>
): SelectDropdownOption[] {
  const used = new Set(usedNames);
  return ALL_PATH_NAMES.filter((name) => !used.has(name))
    .sort((a, b) => a.localeCompare(b))
    .map(pathNameToOption);
}
