"use client";

import { Button } from "@/app/components/shared/Button";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import {
  CHARACTER_SECTION_LABELS,
  type CharacterSectionId,
  type CharacterSectionOrder,
} from "@/app/lib/constants/characterSections";
import {
  CHARACTER_SECTION_ORDER_PREVIEW_CHIP_WIDTH_CLASS,
  type CharacterSectionGridPreview,
  characterSectionGridPreviewGridClassName,
  getAvailableCharacterSectionGridPreviewOptions,
  isCharacterSectionGridPreview,
  resolveCharacterSectionGridPreviewForViewport,
} from "@/app/lib/characterSectionGridLayout";
import {
  characterSectionOrdersEqual,
  isDefaultCharacterSectionOrder,
  reorderCharacterSectionIds,
  resolveCharacterSectionOrderList,
  toPersistedCharacterSectionOrder,
} from "@/app/lib/characterSectionOrder";
import type { CharacterLayoutMode } from "@/app/lib/types/user";
import { useViewportWidth } from "@/hooks/use-viewport-width";
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
  characterLayoutMode?: CharacterLayoutMode;
};

export function CharacterSectionOrderSettings({
  userId,
  savedOrder,
  onSaved,
  disabled = false,
  characterLayoutMode = "horizontal",
}: CharacterSectionOrderSettingsProps) {
  const viewportWidth = useViewportWidth();
  const effectiveSavedOrder = useMemo(
    () => resolveCharacterSectionOrderList(savedOrder),
    [savedOrder]
  );
  const [draftOrder, setDraftOrder] = useState<CharacterSectionId[] | null>(
    null
  );
  const order = draftOrder ?? effectiveSavedOrder;
  const [gridPreview, setGridPreview] =
    useState<CharacterSectionGridPreview>("mobile");
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

  const isVerticalLayout = characterLayoutMode === "vertical";
  const availableGridPreviewOptions = useMemo(
    () => getAvailableCharacterSectionGridPreviewOptions(viewportWidth),
    [viewportWidth]
  );
  const effectiveGridPreview = resolveCharacterSectionGridPreviewForViewport(
    gridPreview,
    viewportWidth
  );
  const previewGridClassName =
    characterSectionGridPreviewGridClassName(effectiveGridPreview);
  const listLayoutClassName = isVerticalLayout
    ? previewGridClassName
    : "flex flex-col gap-2";

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
            {isVerticalLayout ? (
              <>
                {" "}
                Use the layout preview to see how sections wrap at different
                screen sizes.
              </>
            ) : (
              <> Sections appear in carousel order on the character page.</>
            )}
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

      {isVerticalLayout ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-black">Layout preview</p>
          <div className="mt-2">
            <RadioGroup
              name="character-section-grid-preview"
              value={effectiveGridPreview}
              variant="chip"
              density="compact"
              options={[...availableGridPreviewOptions]}
              onChange={(value) => {
                if (isCharacterSectionGridPreview(value)) {
                  setGridPreview(value);
                }
              }}
              disabled={disabled || saving}
            />
          </div>
        </div>
      ) : null}

      <ul
        className={`mt-3 ${listLayoutClassName}`}
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
              className={`flex items-center gap-2 rounded-md border bg-paleBlue transition-colors ${
                isVerticalLayout
                  ? `h-10 shrink-0 ${CHARACTER_SECTION_ORDER_PREVIEW_CHIP_WIDTH_CLASS} px-2 py-1.5`
                  : "w-full px-3 py-2"
              } ${
                isDropTarget
                  ? "border-customPrimary ring-2 ring-paleBlue ring-offset-1"
                  : "border-black/20"
              } ${isDragging ? "opacity-50" : ""} ${
                disabled || saving
                  ? "cursor-not-allowed opacity-70"
                  : "cursor-grab active:cursor-grabbing"
              }`}
            >
              <span
                className={`select-none leading-none text-black/45 ${
                  isVerticalLayout ? "text-xs" : "text-sm"
                }`}
                aria-hidden
              >
                ⋮⋮
              </span>
              <span
                className={`min-w-0 flex-1 font-medium text-black ${
                  isVerticalLayout ? "truncate text-xs" : "text-sm"
                }`}
              >
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
