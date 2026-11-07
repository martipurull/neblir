"use client";

import { Button } from "@/app/components/shared/Button";
import { isItemCarried } from "@/app/lib/constants/inventory";
import { formatWeightKgForDisplay } from "@/app/lib/carryWeightUtils";
import type { BotHolding, BotPlace, BotPlacedItem } from "@/app/lib/types/bot";
import {
  equipItemOnCharacterBot,
  placeItemOnCharacterBot,
  returnBotItemToCarried,
} from "@/lib/api/bots";
import type { BotEquip } from "@/app/lib/types/bot";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useState } from "react";

type CarryRow = {
  id?: string;
  quantity?: number;
  customName?: string | null;
  itemLocation?: string | null;
  item?: {
    name?: string | null;
    botInstallable?: boolean | null;
  } | null;
};

type BotPlacementSectionProps = {
  characterId: string;
  holding: BotHolding;
  inventory: CarryRow[];
  readOnly?: boolean;
  onChanged: () => Promise<unknown>;
};

function rowLabel(row: {
  customName?: string | null;
  item?: { name?: string | null } | null;
}): string {
  const nickname = row.customName?.trim() ?? "";
  if (nickname.length > 0) return nickname;
  const name = row.item?.name?.trim() ?? "";
  return name.length > 0 ? name : "Item";
}

function capLabel(current: string, max: number | null | undefined): string {
  if (max == null) return `${current} · no cap`;
  return `${current} / ${max}`;
}

export function BotPlacementSection({
  characterId,
  holding,
  inventory,
  readOnly = false,
  onChanged,
}: BotPlacementSectionProps) {
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const carried = inventory.filter(
    (row): row is CarryRow & { id: string } =>
      typeof row.id === "string" && isItemCarried(row)
  );

  const run = async (key: string, action: () => Promise<unknown>) => {
    setBusyId(key);
    setError(null);
    try {
      await action();
      await onChanged();
    } catch (actionError) {
      setError(
        getUserSafeErrorMessage(actionError, "Could not update the bot")
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-3 rounded-md border border-white/10 bg-white/5 p-3">
      <div>
        <div className="font-medium text-white">Placements</div>
        <p className="text-xs text-white/65">
          Installed hardware is not a load. Cargo counts toward cargo capacity.
          Carried items count toward this bot&apos;s carry, not the
          character&apos;s.
        </p>
      </div>
      <PlaceList
        title="Installed"
        summary={capLabel(
          String(holding.installedCount),
          holding.maxInstalledItems
        )}
        items={holding.installedItems}
        readOnly={readOnly}
        busyId={busyId}
        onReturn={(itemCharacterId) =>
          void run(`return-${itemCharacterId}`, () =>
            returnBotItemToCarried(characterId, holding.id, itemCharacterId)
          )
        }
      />
      <PlaceList
        title="Cargo"
        summary={
          holding.maxCargoWeightKg == null
            ? `${formatWeightKgForDisplay(holding.cargoWeightKg)} kg · no cap`
            : `${formatWeightKgForDisplay(holding.cargoWeightKg)} / ${formatWeightKgForDisplay(holding.maxCargoWeightKg)} kg`
        }
        items={holding.cargoItems}
        readOnly={readOnly}
        busyId={busyId}
        onReturn={(itemCharacterId) =>
          void run(`return-${itemCharacterId}`, () =>
            returnBotItemToCarried(characterId, holding.id, itemCharacterId)
          )
        }
      />
      <PlaceList
        title="Carried"
        summary={carrySummary(holding)}
        items={holding.carriedItems}
        readOnly={readOnly}
        busyId={busyId}
        onReturn={(itemCharacterId) =>
          void run(`return-${itemCharacterId}`, () =>
            returnBotItemToCarried(characterId, holding.id, itemCharacterId)
          )
        }
        onEquip={(itemCharacterId, action, slot) =>
          void run(`equip-${itemCharacterId}-${slot}-${action}`, () =>
            equipItemOnCharacterBot(characterId, holding.id, {
              itemCharacterId,
              action,
              slot,
            })
          )
        }
      />
      {!readOnly ? (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-white/60">
            From carried inventory
          </div>
          {carried.length === 0 ? (
            <p className="text-xs text-white/65">Nothing carried to place.</p>
          ) : (
            carried.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span className="text-sm text-white">
                  {rowLabel(row)}
                  {(row.quantity ?? 1) > 1 ? ` ×${row.quantity}` : ""}
                </span>
                <div className="flex flex-wrap gap-2">
                  {row.item?.botInstallable === true ? (
                    <PlaceButton
                      label="Install"
                      busy={busyId != null}
                      onClick={() =>
                        void run(`place-${row.id}-installed`, () =>
                          place(characterId, holding.id, row.id, "installed")
                        )
                      }
                    />
                  ) : null}
                  <PlaceButton
                    label="Cargo"
                    busy={busyId != null}
                    onClick={() =>
                      void run(`place-${row.id}-cargo`, () =>
                        place(characterId, holding.id, row.id, "cargo")
                      )
                    }
                  />
                  <PlaceButton
                    label="Carry"
                    busy={busyId != null}
                    onClick={() =>
                      void run(`place-${row.id}-carried`, () =>
                        place(characterId, holding.id, row.id, "carried")
                      )
                    }
                  />
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
      {error ? <p className="text-sm text-neblirDanger-400">{error}</p> : null}
    </section>
  );
}

function carrySummary(holding: BotHolding): string {
  const carried = formatWeightKgForDisplay(holding.carriedWeightKg);
  const max = holding.effectiveMaxCarryWeight ?? holding.maxCarryWeight;
  return `${carried} / ${formatWeightKgForDisplay(max)} kg`;
}

function place(
  characterId: string,
  botCharacterId: string,
  itemCharacterId: string,
  placeName: BotPlace
) {
  return placeItemOnCharacterBot(characterId, botCharacterId, {
    itemCharacterId,
    place: placeName,
  });
}

function EquipButtons({
  item,
  busy,
  onEquip,
}: {
  item: BotPlacedItem;
  busy: boolean;
  onEquip: (action: BotEquip["action"], slot: "HAND" | "BODY") => void;
}) {
  return (
    <>
      <SlotButton
        item={item}
        slot="HAND"
        label="Hand"
        busy={busy}
        onEquip={onEquip}
      />
      <SlotButton
        item={item}
        slot="BODY"
        label="Body"
        busy={busy}
        onEquip={onEquip}
      />
    </>
  );
}

function SlotButton({
  item,
  slot,
  label,
  busy,
  onEquip,
}: {
  item: BotPlacedItem;
  slot: "HAND" | "BODY";
  label: string;
  busy: boolean;
  onEquip: (action: BotEquip["action"], slot: "HAND" | "BODY") => void;
}) {
  const types = item.item?.equipSlotTypes ?? [];
  const equipped = item.botEquipSlots.includes(slot);
  if (!equipped && types.length > 0 && !types.includes(slot)) return null;
  return (
    <PlaceButton
      label={equipped ? `Unequip ${label.toLowerCase()}` : label}
      busy={busy}
      onClick={() => onEquip(equipped ? "unequip" : "equip", slot)}
    />
  );
}

function PlaceButton({
  label,
  busy,
  onClick,
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="modalPaleOutline"
      fullWidth={false}
      disabled={busy}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function PlaceList({
  title,
  summary,
  items,
  readOnly,
  busyId,
  onReturn,
  onEquip,
}: {
  title: string;
  summary: string;
  items: BotPlacedItem[];
  readOnly: boolean;
  busyId: string | null;
  onReturn: (itemCharacterId: string) => void;
  onEquip?: (
    itemCharacterId: string,
    action: BotEquip["action"],
    slot: "HAND" | "BODY"
  ) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-sm text-white">
        <span>{title}</span>
        <span className="text-xs text-white/65">{summary}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-white/50">None</p>
      ) : (
        items.map((item) => (
          <div
            key={item.itemCharacterId}
            className="flex items-center justify-between gap-2"
          >
            <span className="text-sm text-white">
              {rowLabel(item)}
              {item.quantity > 1 ? ` ×${item.quantity}` : ""}
              <span className="text-white/50">
                {" "}
                · {formatWeightKgForDisplay(item.weightKg)} kg
              </span>
            </span>
            {!readOnly ? (
              <div className="flex flex-wrap justify-end gap-2">
                {onEquip ? (
                  <EquipButtons
                    item={item}
                    busy={busyId != null}
                    onEquip={(action, slot) =>
                      onEquip(item.itemCharacterId, action, slot)
                    }
                  />
                ) : null}
                <Button
                  type="button"
                  variant="modalPaleOutline"
                  fullWidth={false}
                  disabled={busyId != null}
                  onClick={() => onReturn(item.itemCharacterId)}
                >
                  Return
                </Button>
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
