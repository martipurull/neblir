import { Race } from "@prisma/client";

function defaultRaceLabel(value: Race): string {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function getRaceLabel(value: Race): string {
  return defaultRaceLabel(value);
}

export const RACES: { value: Race; label: string }[] = (
  Object.values(Race) as Race[]
).map((value) => ({
  value,
  label: getRaceLabel(value),
}));
