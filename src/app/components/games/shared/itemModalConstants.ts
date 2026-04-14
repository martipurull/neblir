export const ATTACK_ROLL_TYPES = [
  { value: "RANGE", label: "Range" },
  { value: "MELEE", label: "Melee" },
  { value: "GRID", label: "Grid" },
  { value: "THROW", label: "Throw" },
] as const;

export const DAMAGE_TYPES = [
  "BULLET",
  "BLADE",
  "SIIKE",
  "ACID",
  "FIRE",
  "ICE",
  "BLUDGEONING",
  "ELECTRICITY",
  "NERVE",
  "POISON",
  "OTHER",
] as const;

export const EQUIP_SLOTS = [
  { value: "HAND", label: "Hand" },
  { value: "FOOT", label: "Foot" },
  { value: "BODY", label: "Body" },
  { value: "HEAD", label: "Head" },
  { value: "BRAIN", label: "Brain" },
] as const;
