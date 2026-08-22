"use client";

import { formatEquipSlotRequirementLines } from "@/app/lib/equipSlotDisplay";
import type { ItemBrowseDetailFields } from "@/app/lib/types/itemBrowseDetail";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { StoredRichTextHtml } from "@/app/components/shared/StoredRichTextHtml";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useMemo } from "react";

function fmt(n: number) {
  return n >= 0 ? `+${n}` : String(n);
}

type BrowseItemDetailsViewProps = {
  item: ItemBrowseDetailFields;
  /** Prefix for image URL cache keys when multiple instances may mount. */
  imageKeyPrefix?: string;
};

export function BrowseItemDetailsView({
  item,
  imageKeyPrefix = "browse",
}: BrowseItemDetailsViewProps) {
  const itemImageKey = item.imageKey ?? null;
  const imageEntries = useMemo(
    () =>
      itemImageKey
        ? [{ id: `${imageKeyPrefix}-${item.id}`, imageKey: itemImageKey }]
        : [],
    [imageKeyPrefix, item.id, itemImageKey]
  );
  const imageUrls = useImageUrls(imageEntries);
  const itemImageUrl = itemImageKey
    ? imageUrls[`${imageKeyPrefix}-${item.id}`]
    : null;

  const isWeapon = item.type === "WEAPON";
  const equipRequirementLines = item.equippable
    ? formatEquipSlotRequirementLines(item)
    : [];

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="text-white/60 uppercase tracking-wider">Name</span>
          <p className="mt-0.5 text-white">{item.name}</p>
        </div>
        {itemImageKey ? (
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
            {itemImageUrl ? (
              <SignedRemoteImage
                src={itemImageUrl}
                imageKey={itemImageKey}
                alt=""
                width={80}
                height={80}
                className="h-20 w-20 object-cover object-center"
              />
            ) : itemImageUrl === undefined ? (
              <ImageLoadingSkeleton variant="item" />
            ) : null}
          </div>
        ) : null}
      </div>

      {item.description ? (
        <div>
          <span className="text-white/60 uppercase tracking-wider">
            Description
          </span>
          <StoredRichTextHtml
            content={item.description}
            className="mt-0.5 text-white"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-white/60 uppercase tracking-wider">Type</span>
          <p className="mt-0.5 text-white">{item.type}</p>
        </div>
        <div>
          <span className="text-white/60 uppercase tracking-wider">Weight</span>
          <p className="mt-0.5 text-white">
            {item.weight != null ? `${item.weight} kg` : "—"}
          </p>
        </div>
        <div>
          <span className="text-white/60 uppercase tracking-wider">Cost</span>
          <p className="mt-0.5 text-white">
            {item.confCost != null
              ? `${item.confCost}${item.costInfo ? ` (${item.costInfo})` : ""}`
              : "—"}
          </p>
        </div>
        {item.maxUses != null ? (
          <div>
            <span className="text-white/60 uppercase tracking-wider">
              Max uses
            </span>
            <p className="mt-0.5 text-white">{item.maxUses}</p>
          </div>
        ) : null}
      </div>

      {item.equippable ? (
        <div>
          <span className="text-white/60 uppercase tracking-wider">
            Equippable
          </span>
          <p className="mt-0.5 text-white">Yes</p>
          {equipRequirementLines.length > 0 ? (
            <ul className="mt-1 list-none space-y-1 text-sm text-white/90">
              {equipRequirementLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {isWeapon ? (
        <>
          {item.attackRoll && item.attackRoll.length > 0 ? (
            <div>
              <span className="text-white/60 uppercase tracking-wider">
                Attack roll
              </span>
              <p className="mt-0.5 text-white">{item.attackRoll.join(", ")}</p>
            </div>
          ) : null}
          {item.damage ? (
            <div>
              <span className="text-white/60 uppercase tracking-wider">
                Damage
              </span>
              <p className="mt-0.5 text-white">
                {item.damage.numberOfDice}d{item.damage.diceType}{" "}
                {item.damage.damageType?.join(", ")}
              </p>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            {item.attackMeleeBonus != null ? (
              <div>
                <span className="text-white/60 uppercase tracking-wider">
                  Melee atk
                </span>
                <p className="mt-0.5 text-white">
                  {fmt(item.attackMeleeBonus)}
                </p>
              </div>
            ) : null}
            {item.attackRangeBonus != null ? (
              <div>
                <span className="text-white/60 uppercase tracking-wider">
                  Range atk
                </span>
                <p className="mt-0.5 text-white">
                  {fmt(item.attackRangeBonus)}
                </p>
              </div>
            ) : null}
            {item.attackThrowBonus != null ? (
              <div>
                <span className="text-white/60 uppercase tracking-wider">
                  Throw atk
                </span>
                <p className="mt-0.5 text-white">
                  {fmt(item.attackThrowBonus)}
                </p>
              </div>
            ) : null}
            {item.defenceMeleeBonus != null ? (
              <div>
                <span className="text-white/60 uppercase tracking-wider">
                  Melee def
                </span>
                <p className="mt-0.5 text-white">
                  {fmt(item.defenceMeleeBonus)}
                </p>
              </div>
            ) : null}
            {item.defenceRangeBonus != null ? (
              <div>
                <span className="text-white/60 uppercase tracking-wider">
                  Range def
                </span>
                <p className="mt-0.5 text-white">
                  {fmt(item.defenceRangeBonus)}
                </p>
              </div>
            ) : null}
            {item.gridAttackBonus != null ? (
              <div>
                <span className="text-white/60 uppercase tracking-wider">
                  Grid atk
                </span>
                <p className="mt-0.5 text-white">{fmt(item.gridAttackBonus)}</p>
              </div>
            ) : null}
            {item.gridDefenceBonus != null ? (
              <div>
                <span className="text-white/60 uppercase tracking-wider">
                  Grid def
                </span>
                <p className="mt-0.5 text-white">
                  {fmt(item.gridDefenceBonus)}
                </p>
              </div>
            ) : null}
            {item.effectiveRange != null ? (
              <div>
                <span className="text-white/60 uppercase tracking-wider">
                  Effective range
                </span>
                <p className="mt-0.5 text-white">{item.effectiveRange}</p>
              </div>
            ) : null}
            {item.maxRange != null ? (
              <div>
                <span className="text-white/60 uppercase tracking-wider">
                  Max range
                </span>
                <p className="mt-0.5 text-white">{item.maxRange}</p>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {item.usage ? (
        <div>
          <span className="text-white/60 uppercase tracking-wider">Usage</span>
          <StoredRichTextHtml
            content={item.usage}
            className="mt-0.5 text-white"
          />
        </div>
      ) : null}

      {item.notes ? (
        <div>
          <span className="text-white/60 uppercase tracking-wider">Notes</span>
          <StoredRichTextHtml
            content={item.notes}
            className="mt-0.5 text-white"
          />
        </div>
      ) : null}
    </div>
  );
}
