"use client";

import Button from "@/app/components/shared/Button";
import { DetailField } from "./DetailField";
import type { InventoryEntry, ResolvedItemNonNull } from "./types";
import { fmtSignedBonus } from "./utils";

type ItemDetailSummaryGridProps = {
  entry: InventoryEntry;
  item: ResolvedItemNonNull | null | undefined;
  displayLocation: string;
  isWeapon: boolean;
  hasRangeAtkBonus: boolean;
  weaponDamage: {
    numberOfDice: number;
    diceType: number;
    damageType?: string[] | null;
  } | null;
  onOpenDamageRoll: () => void;
};

export function ItemDetailSummaryGrid({
  entry,
  item,
  displayLocation,
  isWeapon,
  hasRangeAtkBonus,
  weaponDamage,
  onOpenDamageRoll,
}: ItemDetailSummaryGridProps) {
  const hasWeaponDamage = weaponDamage != null;

  return (
    <div className="grid grid-cols-2 gap-3">
      <DetailField label="Type">{item?.type ?? "—"}</DetailField>
      <DetailField label="Weight">
        {item?.weight != null ? `${item.weight} kg` : "—"}
      </DetailField>
      <DetailField label="Quantity" className="col-span-2">
        {entry.quantity}
      </DetailField>

      {item?.equippable ? (
        <>
          <DetailField label="Location">{displayLocation}</DetailField>
          <DetailField label="Equipped">
            {(entry.equipSlots?.length ?? 0) > 0
              ? `${entry.equipSlots!.join(", ")} slot(s)`
              : "No"}
          </DetailField>
        </>
      ) : (
        <DetailField label="Location" className="col-span-2">
          {displayLocation}
        </DetailField>
      )}

      {isWeapon && item && (
        <>
          {"attackRoll" in item &&
            item.attackRoll &&
            item.attackRoll.length > 0 && (
              <DetailField label="Attack roll">
                {item.attackRoll.join(", ")}
              </DetailField>
            )}
          {item.effectiveRange != null && (
            <DetailField label="Effective range">
              {item.effectiveRange}
            </DetailField>
          )}
          {item.maxRange != null && (
            <DetailField label="Max range">{item.maxRange}</DetailField>
          )}
          {item.attackMeleeBonus != null && (
            <DetailField label="Melee atk">
              {fmtSignedBonus(item.attackMeleeBonus)}
            </DetailField>
          )}
          {(hasRangeAtkBonus || hasWeaponDamage) && (
            <>
              {hasRangeAtkBonus && item.attackRangeBonus != null && (
                <DetailField label="Range atk">
                  {fmtSignedBonus(item.attackRangeBonus)}
                </DetailField>
              )}
              {hasWeaponDamage && weaponDamage && (
                <DetailField
                  label="Damage"
                  className={hasRangeAtkBonus ? undefined : "col-span-2"}
                >
                  <span className="block">
                    {weaponDamage.numberOfDice}d{weaponDamage.diceType}{" "}
                    {weaponDamage.damageType?.join(", ")}
                  </span>
                  <Button
                    type="button"
                    variant="semanticDangerOutline"
                    fullWidth={false}
                    onClick={onOpenDamageRoll}
                    className="mt-2 text-xs p-0"
                  >
                    Roll damage
                  </Button>
                </DetailField>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
