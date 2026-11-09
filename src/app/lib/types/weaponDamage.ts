import { z } from "zod";

export const weaponDamageTypeSchema = z.enum([
  "BULLET",
  "BLADE",
  "SIIKE",
  "ACID",
  "FIRE",
  "ICE",
  "BLUDGEONING",
  "ELECTRICITY",
  "NERVE",
  "GRID",
  "POISON",
  "OTHER",
]);

export type WeaponDamageType = z.infer<typeof weaponDamageTypeSchema>;
