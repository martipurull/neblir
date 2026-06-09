"use client";

import { formatEquipSlotRequirementLines } from "@/app/lib/equipSlotDisplay";
import type { ItemBrowseDetailFields } from "@/app/lib/types/itemBrowseDetail";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { StoredRichTextHtml } from "@/app/components/shared/StoredRichTextHtml";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { Button } from "@/app/components/shared/Button";
import { useImageUrls } from "@/hooks/use-image-urls";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { useMemo, useState } from "react";

const MAX_ADD_QUANTITY = 10;

function parseAddQuantity(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_ADD_QUANTITY);
}

function BrowseItemDetailAddFooter({
  item,
  isAdding,
  onAddToInventory,
}: {
  item: ItemBrowseDetailFields;
  isAdding: boolean;
  onAddToInventory: (
    item: ItemBrowseDetailFields,
    quantity: number
  ) => void | Promise<void>;
}) {
  const [addQuantity, setAddQuantity] = useState("1");

  return (
    <>
      <ModalNumberField
        id={`browse-item-add-quantity-${item.id}`}
        label="Quantity"
        value={addQuantity}
        onChange={setAddQuantity}
        disabled={isAdding}
        required={false}
        min={1}
        max={MAX_ADD_QUANTITY}
        step={1}
      />
      <Button
        type="button"
        variant="semanticSafeOutline"
        onClick={() => {
          void onAddToInventory(item, parseAddQuantity(addQuantity));
        }}
        disabled={isAdding}
        className="w-full"
      >
        {isAdding ? "Adding…" : "Add to inventory"}
      </Button>
    </>
  );
}

export interface BrowseItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemBrowseDetailFields | null;
  /** When provided, shows quantity + add controls (modal stays open after add). */
  onAddToInventory?: (
    item: ItemBrowseDetailFields,
    quantity: number
  ) => void | Promise<void>;
  /** When adding from this modal, pass true to show loading state */
  isAdding?: boolean;
  /** GM flow: opens give-to-character UI for this item */
  onGiveToCharacter?: () => void;
  /** Opens edit UI for this item (GM custom items or owned unique items). */
  onEdit?: () => void;
}

function fmt(n: number) {
  return n >= 0 ? `+${n}` : String(n);
}

export function BrowseItemDetailModal({
  isOpen,
  onClose,
  item,
  onAddToInventory,
  isAdding = false,
  onGiveToCharacter,
  onEdit,
}: BrowseItemDetailModalProps) {
  const itemImageKey = item && "imageKey" in item ? item.imageKey : null;
  const imageEntries = useMemo(
    () =>
      item && itemImageKey
        ? [{ id: `browse-${item.id}`, imageKey: itemImageKey }]
        : [],
    [item, itemImageKey]
  );
  const imageUrls = useImageUrls(imageEntries);
  const itemImageUrl =
    item && itemImageKey ? imageUrls[`browse-${item.id}`] : null;

  if (!isOpen || !item) return null;

  const isWeapon = item.type === "WEAPON";
  const equipRequirementLines = item.equippable
    ? formatEquipSlotRequirementLines(item)
    : [];

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title="Item details"
      titleId="browse-item-detail-modal-title"
      zIndexClass="z-[60]"
      maxWidthClass="max-w-md"
      maxHeightClass="max-h-[90vh]"
      footer={
        onGiveToCharacter || onAddToInventory || onEdit ? (
          <div className="flex w-full flex-col gap-2">
            {onEdit ? (
              <Button
                type="button"
                variant="primarySm"
                onClick={onEdit}
                className="w-full"
              >
                Edit item
              </Button>
            ) : null}
            {onGiveToCharacter ? (
              <Button
                type="button"
                variant="semanticSafeOutline"
                onClick={onGiveToCharacter}
                className="w-full"
              >
                Give item to character
              </Button>
            ) : null}
            {onAddToInventory ? (
              <BrowseItemDetailAddFooter
                key={item.id}
                item={item}
                isAdding={isAdding}
                onAddToInventory={onAddToInventory}
              />
            ) : null}
          </div>
        ) : undefined
      }
    >
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
                  imageKey={itemImageKey ?? undefined}
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

        {item.description && (
          <div>
            <span className="text-white/60 uppercase tracking-wider">
              Description
            </span>
            <StoredRichTextHtml
              content={item.description}
              className="mt-0.5 text-white"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-white/60 uppercase tracking-wider">Type</span>
            <p className="mt-0.5 text-white">{item.type}</p>
          </div>
          <div>
            <span className="text-white/60 uppercase tracking-wider">
              Weight
            </span>
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
          {"maxUses" in item && item.maxUses != null && (
            <div>
              <span className="text-white/60 uppercase tracking-wider">
                Max uses
              </span>
              <p className="mt-0.5 text-white">{item.maxUses}</p>
            </div>
          )}
        </div>

        {item.equippable && (
          <div>
            <span className="text-white/60 uppercase tracking-wider">
              Equippable
            </span>
            <p className="mt-0.5 text-white">Yes</p>
            {equipRequirementLines.length > 0 && (
              <ul className="mt-1 list-none space-y-1 text-sm text-white/90">
                {equipRequirementLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isWeapon && (
          <>
            {"attackRoll" in item &&
              item.attackRoll &&
              item.attackRoll.length > 0 && (
                <div>
                  <span className="text-white/60 uppercase tracking-wider">
                    Attack roll
                  </span>
                  <p className="mt-0.5 text-white">
                    {item.attackRoll.join(", ")}
                  </p>
                </div>
              )}
            {"damage" in item && item.damage && (
              <div>
                <span className="text-white/60 uppercase tracking-wider">
                  Damage
                </span>
                <p className="mt-0.5 text-white">
                  {item.damage.numberOfDice}d{item.damage.diceType}{" "}
                  {item.damage.damageType?.join(", ")}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {"attackMeleeBonus" in item && item.attackMeleeBonus != null && (
                <div>
                  <span className="text-white/60 uppercase tracking-wider">
                    Melee atk
                  </span>
                  <p className="mt-0.5 text-white">
                    {fmt(item.attackMeleeBonus)}
                  </p>
                </div>
              )}
              {"attackRangeBonus" in item && item.attackRangeBonus != null && (
                <div>
                  <span className="text-white/60 uppercase tracking-wider">
                    Range atk
                  </span>
                  <p className="mt-0.5 text-white">
                    {fmt(item.attackRangeBonus)}
                  </p>
                </div>
              )}
              {"attackThrowBonus" in item && item.attackThrowBonus != null && (
                <div>
                  <span className="text-white/60 uppercase tracking-wider">
                    Throw atk
                  </span>
                  <p className="mt-0.5 text-white">
                    {fmt(item.attackThrowBonus)}
                  </p>
                </div>
              )}
              {item.defenceMeleeBonus != null && (
                <div>
                  <span className="text-white/60 uppercase tracking-wider">
                    Melee def
                  </span>
                  <p className="mt-0.5 text-white">
                    {fmt(item.defenceMeleeBonus)}
                  </p>
                </div>
              )}
              {item.defenceRangeBonus != null && (
                <div>
                  <span className="text-white/60 uppercase tracking-wider">
                    Range def
                  </span>
                  <p className="mt-0.5 text-white">
                    {fmt(item.defenceRangeBonus)}
                  </p>
                </div>
              )}
              {item.gridAttackBonus != null && (
                <div>
                  <span className="text-white/60 uppercase tracking-wider">
                    Grid atk
                  </span>
                  <p className="mt-0.5 text-white">
                    {fmt(item.gridAttackBonus)}
                  </p>
                </div>
              )}
              {item.gridDefenceBonus != null && (
                <div>
                  <span className="text-white/60 uppercase tracking-wider">
                    Grid def
                  </span>
                  <p className="mt-0.5 text-white">
                    {fmt(item.gridDefenceBonus)}
                  </p>
                </div>
              )}
              {"effectiveRange" in item && item.effectiveRange != null && (
                <div>
                  <span className="text-white/60 uppercase tracking-wider">
                    Effective range
                  </span>
                  <p className="mt-0.5 text-white">{item.effectiveRange}</p>
                </div>
              )}
              {"maxRange" in item && item.maxRange != null && (
                <div>
                  <span className="text-white/60 uppercase tracking-wider">
                    Max range
                  </span>
                  <p className="mt-0.5 text-white">{item.maxRange}</p>
                </div>
              )}
            </div>
          </>
        )}

        {"usage" in item && item.usage && (
          <div>
            <span className="text-white/60 uppercase tracking-wider">
              Usage
            </span>
            <StoredRichTextHtml
              content={item.usage}
              className="mt-0.5 text-white"
            />
          </div>
        )}

        {item.notes && (
          <div>
            <span className="text-white/60 uppercase tracking-wider">
              Notes
            </span>
            <StoredRichTextHtml
              content={item.notes}
              className="mt-0.5 text-white"
            />
          </div>
        )}
      </div>
    </ModalShell>
  );
}
