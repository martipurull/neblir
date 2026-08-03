"use client";

import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { StoredRichTextHtml } from "@/app/components/shared/StoredRichTextHtml";
import { TextArea } from "@/app/components/shared/TextArea";
import { TextField } from "@/app/components/shared/TextField";
import {
  ModalSelect,
  type ModalSelectOption,
} from "@/app/components/games/shared/ModalSelect";
import { useImageUrls } from "@/hooks/use-image-urls";
import { isItemCarried } from "@/app/lib/constants/inventory";
import { isItemInventoryOperational } from "@/app/lib/types/item";
import {
  addCharacterVehiclePassenger,
  attachCharacterVehicleMountedItem,
  deleteCharacterVehicleEntry,
  detachCharacterVehicleMountedItem,
  removeCharacterVehiclePassenger,
  retrieveCharacterVehicleCargo,
  stowCharacterVehicleCargo,
  transferCharacterVehicle,
  updateCharacterActiveVehicle,
  updateCharacterVehicleEntry,
} from "@/lib/api/vehicles";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useEffect, useMemo, useState } from "react";
import type { KeyedMutator } from "swr";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { SelectDropdownOption } from "@/app/components/shared/SelectDropdown";
import type { VehicleCharacter } from "@/app/lib/types/vehicle";

export type VehicleDetailModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  entry: VehicleCharacter;
  characterId: string;
  inventory: NonNullable<CharacterDetail["inventory"]>;
  /** ItemCharacter ids already mounted on any of this character's vehicles. */
  allMountedItemCharacterIds?: string[];
  activeVehicleCharacterId?: string | null;
  mutateAction: KeyedMutator<CharacterDetail | null>;
  resolveGiveRecipientsAction: (
    entry: VehicleCharacter
  ) => Promise<SelectDropdownOption[]>;
  onEditUniqueVehicleAction?: () => void;
};

const VEHICLE_STATUS_LABELS = {
  OPERATIONAL: "Operational",
  BROKEN_DOWN: "Broken down",
  BEYOND_REPAIR: "Beyond repair",
} as const;

function locomotionLabel(modes: string[] | undefined): string {
  if (!modes?.length) return "—";
  return modes.join(" · ");
}

function statusClassName(entry: VehicleCharacter): string {
  if (entry.derivedStatus === "OPERATIONAL") {
    return "border-neblirSafe-400 text-neblirSafe-400";
  }
  if (entry.derivedStatus === "BROKEN_DOWN") {
    return "border-neblirWarning-400 text-neblirWarning-400";
  }
  return "border-neblirDanger-400 text-neblirDanger-400";
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/60">
        {label}
      </div>
      <div className="mt-1 text-sm text-white">
        {value == null || value === "" ? "—" : value}
      </div>
    </div>
  );
}

export function VehicleDetailModal({
  isOpen,
  onCloseAction,
  entry,
  characterId,
  inventory,
  allMountedItemCharacterIds = [],
  activeVehicleCharacterId,
  mutateAction,
  resolveGiveRecipientsAction,
  onEditUniqueVehicleAction,
}: VehicleDetailModalProps) {
  const [notesDraft, setNotesDraft] = useState(entry.notes ?? "");
  const [parkedAtDraft, setParkedAtDraft] = useState(entry.parkedAt ?? "");
  const [dismountLocation, setDismountLocation] = useState(
    entry.parkedAt ?? ""
  );
  const [recipientId, setRecipientId] = useState("");
  const [recipientOptions, setRecipientOptions] = useState<
    SelectDropdownOption[]
  >([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [mountItemId, setMountItemId] = useState("");
  const [cargoItemId, setCargoItemId] = useState("");
  const [passengerId, setPassengerId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const imageKey = entry.vehicle?.imageKey ?? null;
  const imageEntries = useMemo(
    () => (imageKey ? [{ id: `vehicle-${entry.id}`, imageKey }] : []),
    [entry.id, imageKey]
  );
  const imageUrls = useImageUrls(imageEntries);
  const imageUrl = imageKey ? imageUrls[`vehicle-${entry.id}`] : null;
  const isActive = activeVehicleCharacterId === entry.id;
  const displayName =
    entry.customName ?? entry.vehicle?.name ?? "Unknown vehicle";
  const mountedItems = useMemo(
    () => entry.mountedItems ?? [],
    [entry.mountedItems]
  );
  const cargoItems = useMemo(() => entry.cargoItems ?? [], [entry.cargoItems]);
  const passengers = useMemo(() => entry.passengers ?? [], [entry.passengers]);
  const passengerCharacterIds = useMemo(
    () => entry.passengerCharacterIds ?? [],
    [entry.passengerCharacterIds]
  );
  const maxMountedItems = entry.vehicle?.maxMountedItems ?? null;
  const maxCargoWeightKg = entry.vehicle?.maxCargoWeightKg ?? null;
  const maxPassengers = entry.vehicle?.maxPassengers ?? 1;
  const mountAtCapacity =
    maxMountedItems != null && mountedItems.length >= maxMountedItems;
  const cargoWeightKg = entry.cargoWeightKg ?? 0;
  const occupantCount = entry.occupantCount ?? 0;
  const passengerAtCapacity = occupantCount >= maxPassengers;

  const mountedItemCharacterIds = useMemo(() => {
    const ids = new Set<string>(allMountedItemCharacterIds);
    for (const mount of mountedItems) {
      ids.add(mount.itemCharacterId);
    }
    return ids;
  }, [allMountedItemCharacterIds, mountedItems]);

  const mountableInventoryOptions: ModalSelectOption[] = useMemo(() => {
    return inventory
      .filter(
        (row) =>
          isItemCarried(row) &&
          isItemInventoryOperational(row.status) &&
          !mountedItemCharacterIds.has(row.id)
      )
      .map((row) => ({
        value: row.id,
        label:
          row.customName?.trim() ?? row.item?.name?.trim() ?? "Unknown item",
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
      );
  }, [inventory, mountedItemCharacterIds]);

  const stowableCargoOptions: ModalSelectOption[] = useMemo(() => {
    return inventory
      .filter(
        (row) =>
          isItemCarried(row) &&
          isItemInventoryOperational(row.status) &&
          !mountedItemCharacterIds.has(row.id)
      )
      .map((row) => ({
        value: row.id,
        label:
          row.customName?.trim() ?? row.item?.name?.trim() ?? "Unknown item",
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
      );
  }, [inventory, mountedItemCharacterIds]);

  const passengerOptions: ModalSelectOption[] = useMemo(
    () =>
      recipientOptions.filter(
        (option) =>
          option.value !== characterId &&
          !passengerCharacterIds.includes(option.value)
      ),
    [characterId, passengerCharacterIds, recipientOptions]
  );

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setRecipientsLoading(true);
    setActionError(null);
    void resolveGiveRecipientsAction(entry)
      .then((options) => {
        if (cancelled) return;
        setRecipientOptions(options);
        setRecipientId("");
      })
      .catch((e) => {
        if (cancelled) return;
        setRecipientOptions([]);
        setActionError(getUserSafeErrorMessage(e, "Could not load characters"));
      })
      .finally(() => {
        if (!cancelled) setRecipientsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entry, isOpen, resolveGiveRecipientsAction]);

  const runAction = async (label: string, action: () => Promise<void>) => {
    setBusyAction(label);
    setActionError(null);
    try {
      await action();
      await mutateAction();
    } catch (e) {
      setActionError(getUserSafeErrorMessage(e, "Vehicle action failed"));
    } finally {
      setBusyAction(null);
    }
  };

  const handleTransfer = async () => {
    if (!recipientId) {
      setActionError("Choose a character to transfer the vehicle to.");
      return;
    }
    await runAction("transfer", async () => {
      await transferCharacterVehicle(characterId, entry.id, {
        toCharacterId: recipientId,
      });
      onCloseAction();
    });
  };

  const handleRemove = async () => {
    if (!window.confirm("Remove this vehicle from the character?")) return;
    await runAction("remove", async () => {
      await deleteCharacterVehicleEntry(characterId, entry.id);
      onCloseAction();
    });
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={onCloseAction}
      title="Vehicle details"
      titleId="vehicle-detail-modal-title"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4 text-sm text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-white">
                {displayName}
              </h3>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs ${statusClassName(entry)}`}
              >
                {VEHICLE_STATUS_LABELS[entry.derivedStatus]}
              </span>
              {isActive ? (
                <span className="rounded-full border border-paleBlue px-2 py-0.5 text-xs text-paleBlue">
                  Riding
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-white/70">
              {entry.vehicle?.brand ? `${entry.vehicle.brand} · ` : ""}
              {entry.vehicle?.vehicleSizeCategory ?? "—"} ·{" "}
              {locomotionLabel(entry.vehicle?.locomotionModes)}
            </p>
          </div>
          {imageKey ? (
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
              {imageUrl ? (
                <SignedRemoteImage
                  src={imageUrl}
                  imageKey={imageKey}
                  alt=""
                  width={80}
                  height={80}
                  className="h-20 w-20 object-cover object-center"
                />
              ) : imageUrl === undefined ? (
                <ImageLoadingSkeleton variant="item" />
              ) : null}
            </div>
          ) : null}
        </div>

        {entry.vehicle?.description ? (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/60">
              Description
            </div>
            <StoredRichTextHtml
              content={entry.vehicle.description}
              className="mt-1 text-white"
            />
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label="Current HP" value={entry.currentHp} />
          <DetailRow label="Effective max HP" value={entry.effectiveMaxHp} />
          <DetailRow label="Max HP bonus" value={entry.maxHpBonus} />
          <DetailRow
            label="Combat speed"
            value={
              entry.vehicle?.combatSpeedMetres != null
                ? `${entry.vehicle.combatSpeedMetres} m`
                : "—"
            }
          />
          <DetailRow
            label="Travel speed"
            value={
              entry.vehicle?.travelSpeedKmh != null
                ? `${entry.vehicle.travelSpeedKmh} km/h`
                : "—"
            }
          />
          <DetailRow
            label="Manoeuvrability"
            value={entry.vehicle?.manoeuvrability}
          />
          <DetailRow
            label="Max passengers"
            value={entry.vehicle?.maxPassengers}
          />
          <DetailRow
            label="Max mounted items"
            value={entry.vehicle?.maxMountedItems}
          />
          <DetailRow
            label="Parked at"
            value={isActive ? "Mounted" : entry.parkedAt}
          />
        </div>

        <section className="space-y-2 rounded-md border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-white">HP adjustments</div>
              <p className="text-xs text-white/65">
                Update vehicle HP without changing template stats.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[-5, -1, 1, 5].map((amount) => (
              <Button
                key={amount}
                type="button"
                variant="modalPaleOutline"
                fullWidth={false}
                disabled={busyAction != null}
                onClick={() => {
                  void runAction(`hp-${amount}`, async () => {
                    await updateCharacterVehicleEntry(characterId, entry.id, {
                      action: "adjustHp",
                      amount,
                    });
                  });
                }}
              >
                {amount > 0 ? `+${amount} HP` : `${amount} HP`}
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-md border border-white/10 bg-white/5 p-3">
          <div>
            <div className="font-medium text-white">Condition</div>
            <p className="text-xs text-white/65">
              Broken down status is derived from HP. Beyond repair is a manual
              lock.
            </p>
          </div>
          <Checkbox
            checked={entry.isBeyondRepair}
            onChange={(checked) => {
              void runAction("beyond-repair", async () => {
                await updateCharacterVehicleEntry(characterId, entry.id, {
                  action: "setBeyondRepair",
                  isBeyondRepair: checked,
                });
              });
            }}
            label="Mark as beyond repair"
            disabled={busyAction != null}
            tone="inverse"
          />
        </section>

        <section className="space-y-3 rounded-md border border-white/10 bg-white/5 p-3">
          <div>
            <div className="font-medium text-white">Riding and parking</div>
            <p className="text-xs text-white/65">
              Mounting clears the parked location. Dismounting requires a
              location.
            </p>
          </div>
          {isActive ? (
            <>
              <TextField
                id={`vehicle-dismount-location-${entry.id}`}
                type="text"
                variant="dark"
                value={dismountLocation}
                onChange={(e) => setDismountLocation(e.target.value)}
                placeholder="Where did you leave the vehicle?"
                disabled={busyAction != null}
              />
              <Button
                type="button"
                variant="modalPalePrimary"
                fullWidth={false}
                disabled={busyAction != null || !dismountLocation.trim()}
                onClick={() => {
                  void runAction("dismount", async () => {
                    await updateCharacterActiveVehicle(characterId, {
                      action: "dismount",
                      parkedAt: dismountLocation.trim(),
                    });
                  });
                }}
              >
                Dismount vehicle
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="modalPalePrimary"
                  fullWidth={false}
                  disabled={busyAction != null || !entry.canBeRidden}
                  onClick={() => {
                    void runAction("mount", async () => {
                      await updateCharacterActiveVehicle(characterId, {
                        action: "mount",
                        vehicleCharacterId: entry.id,
                      });
                    });
                  }}
                >
                  {entry.canBeRidden ? "Mount vehicle" : "Cannot be ridden"}
                </Button>
              </div>
              <div className="space-y-2">
                <TextField
                  id={`vehicle-parked-at-${entry.id}`}
                  type="text"
                  variant="dark"
                  value={parkedAtDraft}
                  onChange={(e) => setParkedAtDraft(e.target.value)}
                  placeholder="Set parked location"
                  disabled={busyAction != null}
                />
                <Button
                  type="button"
                  variant="modalPaleOutline"
                  fullWidth={false}
                  disabled={busyAction != null || !parkedAtDraft.trim()}
                  onClick={() => {
                    void runAction("parked-at", async () => {
                      await updateCharacterVehicleEntry(characterId, entry.id, {
                        action: "setParkedAt",
                        parkedAt: parkedAtDraft.trim(),
                      });
                    });
                  }}
                >
                  Save parked location
                </Button>
              </div>
            </>
          )}
        </section>

        <section className="space-y-3 rounded-md border border-white/10 bg-white/5 p-3">
          <div>
            <div className="font-medium text-white">Instance notes</div>
            <p className="text-xs text-white/65">
              These notes belong to this owned vehicle row, not the catalogue
              template.
            </p>
          </div>
          <TextArea
            id={`vehicle-notes-${entry.id}`}
            variant="dark"
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            rows={4}
            placeholder="Add vehicle notes"
            disabled={busyAction != null}
          />
          <Button
            type="button"
            variant="modalPaleOutline"
            fullWidth={false}
            disabled={busyAction != null}
            onClick={() => {
              void runAction("notes", async () => {
                await updateCharacterVehicleEntry(characterId, entry.id, {
                  action: "setNotes",
                  notes: notesDraft.trim() || null,
                });
              });
            }}
          >
            Save notes
          </Button>
        </section>

        <section className="space-y-3 rounded-md border border-white/10 bg-white/5 p-3">
          <div>
            <div className="font-medium text-white">Mounted items</div>
            <p className="text-xs text-white/65">
              Link items from this character&apos;s inventory to the vehicle.
              Ownership stays in inventory; equipped items are unequipped when
              mounted.
              {maxMountedItems != null
                ? ` Capacity: ${mountedItems.length}/${maxMountedItems}.`
                : null}
            </p>
          </div>

          {mountedItems.length > 0 ? (
            <ul className="space-y-2">
              {mountedItems.map((mount) => {
                const label =
                  mount.itemCharacter?.customName?.trim() ??
                  mount.itemCharacter?.item?.name?.trim() ??
                  "Unknown item";
                return (
                  <li
                    key={mount.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-white">{label}</div>
                      {mount.mountSlot ? (
                        <div className="text-xs text-white/60">
                          Slot: {mount.mountSlot}
                        </div>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="modalPaleOutline"
                      fullWidth={false}
                      disabled={busyAction != null}
                      onClick={() => {
                        void runAction(`detach-${mount.id}`, async () => {
                          await detachCharacterVehicleMountedItem(
                            characterId,
                            entry.id,
                            mount.id
                          );
                        });
                      }}
                    >
                      Detach
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-white/70">No items mounted yet.</p>
          )}

          <ModalSelect
            id={`vehicle-mount-item-${entry.id}`}
            label="Inventory item"
            placeholder={
              mountAtCapacity
                ? "Mount capacity reached"
                : mountableInventoryOptions.length === 0
                  ? "No mountable items"
                  : "Select an item to mount"
            }
            value={mountItemId}
            options={mountableInventoryOptions}
            disabled={
              busyAction != null ||
              mountAtCapacity ||
              mountableInventoryOptions.length === 0
            }
            onChange={setMountItemId}
          />
          <Button
            type="button"
            variant="modalPaleOutline"
            fullWidth={false}
            disabled={busyAction != null || !mountItemId || mountAtCapacity}
            onClick={() => {
              void runAction("attach-mount", async () => {
                await attachCharacterVehicleMountedItem(characterId, entry.id, {
                  itemCharacterId: mountItemId,
                });
                setMountItemId("");
              });
            }}
          >
            Mount item
          </Button>
        </section>

        <section className="space-y-3 rounded-md border border-white/10 bg-white/5 p-3">
          <div>
            <div className="font-medium text-white">Cargo</div>
            <p className="text-xs text-white/65">
              Stow carried inventory in the vehicle. Cargo does not count toward
              carry weight.
              {maxCargoWeightKg != null
                ? ` Capacity: ${cargoWeightKg.toFixed(1)}/${maxCargoWeightKg} kg.`
                : ` Current load: ${cargoWeightKg.toFixed(1)} kg.`}
            </p>
          </div>

          {cargoItems.length > 0 ? (
            <ul className="space-y-2">
              {cargoItems.map((cargo) => {
                const label =
                  cargo.customName?.trim() ??
                  cargo.item?.name?.trim() ??
                  "Unknown item";
                return (
                  <li
                    key={cargo.itemCharacterId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-white">{label}</div>
                      <div className="text-xs text-white/60">
                        Qty {cargo.quantity} · {cargo.weightKg.toFixed(1)} kg
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="modalPaleOutline"
                      fullWidth={false}
                      disabled={busyAction != null}
                      onClick={() => {
                        void runAction(
                          `retrieve-${cargo.itemCharacterId}`,
                          async () => {
                            await retrieveCharacterVehicleCargo(
                              characterId,
                              entry.id,
                              cargo.itemCharacterId
                            );
                          }
                        );
                      }}
                    >
                      Retrieve
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-white/70">No cargo stowed.</p>
          )}

          <ModalSelect
            id={`vehicle-cargo-item-${entry.id}`}
            label="Carried item"
            placeholder={
              stowableCargoOptions.length === 0
                ? "No carried items to stow"
                : "Select an item to stow"
            }
            value={cargoItemId}
            options={stowableCargoOptions}
            disabled={busyAction != null || stowableCargoOptions.length === 0}
            onChange={setCargoItemId}
          />
          <Button
            type="button"
            variant="modalPaleOutline"
            fullWidth={false}
            disabled={busyAction != null || !cargoItemId}
            onClick={() => {
              void runAction("stow-cargo", async () => {
                await stowCharacterVehicleCargo(characterId, entry.id, {
                  itemCharacterId: cargoItemId,
                });
                setCargoItemId("");
              });
            }}
          >
            Stow as cargo
          </Button>
        </section>

        <section className="space-y-3 rounded-md border border-white/10 bg-white/5 p-3">
          <div>
            <div className="font-medium text-white">Passengers</div>
            <p className="text-xs text-white/65">
              Max passengers includes the driver. Occupants: {occupantCount}/
              {maxPassengers}
              {entry.driverPresent ? " (driver present)" : " (no driver yet)"}.
            </p>
          </div>

          {passengers.length > 0 ? (
            <ul className="space-y-2">
              {passengers.map((passenger) => {
                const label = [passenger.name, passenger.surname]
                  .filter(Boolean)
                  .join(" ")
                  .trim();
                return (
                  <li
                    key={passenger.characterId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <div className="font-medium text-white">
                      {label || "Unnamed"}
                    </div>
                    <Button
                      type="button"
                      variant="modalPaleOutline"
                      fullWidth={false}
                      disabled={busyAction != null}
                      onClick={() => {
                        void runAction(
                          `remove-passenger-${passenger.characterId}`,
                          async () => {
                            await removeCharacterVehiclePassenger(
                              characterId,
                              entry.id,
                              passenger.characterId
                            );
                          }
                        );
                      }}
                    >
                      Remove
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-white/70">No passengers.</p>
          )}

          <ModalSelect
            id={`vehicle-passenger-${entry.id}`}
            label="Passenger"
            placeholder={
              passengerAtCapacity
                ? "Vehicle is at capacity"
                : passengerOptions.length === 0
                  ? "No eligible passengers"
                  : "Select a character"
            }
            value={passengerId}
            options={passengerOptions}
            disabled={
              busyAction != null ||
              passengerAtCapacity ||
              passengerOptions.length === 0
            }
            onChange={setPassengerId}
          />
          <Button
            type="button"
            variant="modalPaleOutline"
            fullWidth={false}
            disabled={busyAction != null || !passengerId || passengerAtCapacity}
            onClick={() => {
              void runAction("add-passenger", async () => {
                await addCharacterVehiclePassenger(characterId, entry.id, {
                  passengerCharacterId: passengerId,
                });
                setPassengerId("");
              });
            }}
          >
            Add passenger
          </Button>
        </section>

        <section className="space-y-3 rounded-md border border-white/10 bg-white/5 p-3">
          <div>
            <div className="font-medium text-white">Transfer</div>
            <p className="text-xs text-white/65">
              Transfer this vehicle to another visible character who is allowed
              to receive it. Mounted items and passengers are cleared; cargo
              returns to this character&apos;s carried inventory.
            </p>
          </div>
          <SelectDropdown
            id={`vehicle-transfer-recipient-${entry.id}`}
            label="Transfer recipient"
            showLabel={false}
            placeholder={
              recipientsLoading ? "Loading characters…" : "Choose a character"
            }
            value={recipientId}
            options={recipientOptions}
            disabled={
              busyAction != null ||
              recipientsLoading ||
              recipientOptions.length === 0
            }
            onChange={setRecipientId}
          />
          <Button
            type="button"
            variant="modalPaleOutline"
            fullWidth={false}
            disabled={busyAction != null || !recipientId}
            onClick={() => {
              void handleTransfer();
            }}
          >
            Transfer vehicle
          </Button>
        </section>

        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {onEditUniqueVehicleAction ? (
            <Button
              type="button"
              variant="modalPaleOutline"
              fullWidth={false}
              disabled={busyAction != null}
              onClick={onEditUniqueVehicleAction}
            >
              Edit unique vehicle
            </Button>
          ) : null}
          <Button
            type="button"
            variant="danger"
            fullWidth={false}
            disabled={busyAction != null}
            onClick={() => {
              void handleRemove();
            }}
          >
            Remove vehicle
          </Button>
        </div>

        {actionError ? (
          <p className="text-sm text-neblirDanger-400">{actionError}</p>
        ) : null}
      </div>
    </ModalShell>
  );
}
