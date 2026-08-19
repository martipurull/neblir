/** Human-readable label for an `ItemWeaponDamageType` enum value. */
export function weaponDamageTypeLabel(value: string): string {
  return value.replace(/_/g, " ");
}
