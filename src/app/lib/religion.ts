import { Religion } from "@prisma/client";

const RELIGION_LABEL_OVERRIDES: Partial<Record<Religion, string>> = {
  PTSD: "PTSD",
};

function defaultReligionLabel(value: Religion): string {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function getReligionLabel(value: Religion): string {
  return RELIGION_LABEL_OVERRIDES[value] ?? defaultReligionLabel(value);
}

export const RELIGIONS: { value: Religion; label: string }[] = (
  Object.values(Religion) as Religion[]
).map((value) => ({
  value,
  label: getReligionLabel(value),
}));
