"use client";

import { Button } from "@/app/components/shared/Button";
import {
  CHARACTER_SECTION_LABELS,
  type CharacterSectionId,
  type CharacterSectionOrder,
} from "@/app/lib/constants/characterSections";
import {
  characterSectionOrdersEqual,
  isDefaultCharacterSectionOrder,
  reorderCharacterSectionIds,
  resolveCharacterSectionOrderList,
  toPersistedCharacterSectionOrder,
} from "@/app/lib/characterSectionOrder";
import { updateUserCharacterSectionOrder } from "@/lib/api/user";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";

const SAVE_DEBOUNCE_MS = 500;

type CharacterSectionOrderSettingsProps = {
  userId: string;
  savedOrder: CharacterSectionOrder | null | undefined;
  onSaved: () => Promise<unknown>;
  disabled?: boolean;
};

export function CharacterSectionOrderSettings({
  userId,
  savedOrder,
  onSaved,
  disabled = false,
}: CharacterSectionOrderSettingsProps) {
  const effectiveSavedOrder = useMemo(
    () => resolveCharacterSectionOrderList(savedOrder),
    [savedOrder]
  );
  const [draftOrder, setDraftOrder] = useState<CharacterSectionId[] | null>(
    null
  );
  const order = draftOrder ?? effectiveSavedOrder;
  const [draggedId, setDraggedId] = useState<CharacterSectionId | null>(null);
  const [dropTargetId, setDropTargetId] = useState<CharacterSectionId | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bypassDebounceRef = useRef(false);

  const isAtDefault =
    isDefaultCharacterSectionOrder(order) &&
    (savedOrder === null || savedOrder === undefined);

  const persistOrder = useCallback(
    async (nextOrder: CharacterSectionId[]) => {
      setSaving(true);
      setError(null);
      try {
        const payload = toPersistedCharacterSectionOrder(nextOrder);
        await updateUserCharacterSectionOrder(userId, payload);
        await onSaved();
        setDraftOrder(null);
      } catch (e) {
        setDraftOrder(null);
        setError(
          e instanceof Error
            ? e.message
            : "Failed to update character section order"
        );
      } finally {
        setSaving(false);
      }
    },
    [onSaved, userId]
  );

  useEffect(() => {
    if (disabled || bypassDebounceRef.current) return;
    if (characterSectionOrdersEqual(order, effectiveSavedOrder)) return;

    const timer = setTimeout(() => {
      void persistOrder(order);
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [disabled, effectiveSavedOrder, order, persistOrder]);

  const handleDragStart = (
    event: DragEvent<HTMLLIElement>,
    id: CharacterSectionId
  ) => {
    if (disabled || saving) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  };

  const handleDragOver = (
    event: DragEvent<HTMLLIElement>,
    id: CharacterSectionId
  ) => {
    if (disabled || saving || !draggedId || draggedId === id) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetId(id);
  };

  const handleDrop = (
    event: DragEvent<HTMLLIElement>,
    targetId: CharacterSectionId
  ) => {
    event.preventDefault();
    if (disabled || saving || !draggedId || draggedId === targetId) return;
    setDraftOrder((current) =>
      reorderCharacterSectionIds(
        current ?? effectiveSavedOrder,
        draggedId,
        targetId
      )
    );
    setDraggedId(null);
    setDropTargetId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTargetId(null);
  };

  const handleReset = () => {
    if (disabled || saving || isAtDefault) return;
    bypassDebounceRef.current = true;
    const defaultOrder = resolveCharacterSectionOrderList(null);
    setDraftOrder(defaultOrder);
    void persistOrder(defaultOrder).finally(() => {
      bypassDebounceRef.current = false;
    });
  };

  return (
    <div className="mt-4 border-t border-black/20 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-black">
            Character section order
          </p>
          <p className="mt-1 text-xs text-black/75">
            Drag sections to reorder cards on your character page. Changes save
            automatically.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          fullWidth={false}
          disabled={disabled || saving || isAtDefault}
          onClick={handleReset}
          className="shrink-0 px-3 py-1.5 text-sm"
        >
          Reset to default
        </Button>
      </div>

      <ul
        className="mt-3 space-y-2"
        aria-label="Character section order"
        aria-busy={saving}
      >
        {order.map((id) => {
          const isDragging = draggedId === id;
          const isDropTarget = dropTargetId === id && draggedId !== id;

          return (
            <li
              key={id}
              draggable={!disabled && !saving}
              aria-grabbed={isDragging}
              onDragStart={(event) => handleDragStart(event, id)}
              onDragOver={(event) => handleDragOver(event, id)}
              onDrop={(event) => handleDrop(event, id)}
              onDragEnd={handleDragEnd}
              onDragLeave={() => {
                setDropTargetId((current) => (current === id ? null : current));
              }}
              className={`flex items-center gap-3 rounded-md border bg-paleBlue px-3 py-2 transition-colors ${
                isDropTarget
                  ? "border-customPrimary ring-1 ring-customPrimary"
                  : "border-black/20"
              } ${isDragging ? "opacity-50" : ""} ${
                disabled || saving
                  ? "cursor-not-allowed opacity-70"
                  : "cursor-grab active:cursor-grabbing"
              }`}
            >
              <span
                className="select-none text-sm leading-none text-black/45"
                aria-hidden
              >
                ⋮⋮
              </span>
              <span className="text-sm text-black">
                {CHARACTER_SECTION_LABELS[id]}
              </span>
            </li>
          );
        })}
      </ul>

      {saving ? <p className="mt-2 text-xs text-black/60">Saving…</p> : null}
      {error ? (
        <p className="mt-2 text-sm text-neblirDanger-600">{error}</p>
      ) : null}
    </div>
  );
}
