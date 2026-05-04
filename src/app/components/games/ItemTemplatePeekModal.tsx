"use client";

import Button from "@/app/components/shared/Button";
import type { ItemBrowseDetailFields } from "@/app/lib/types/itemBrowseDetail";
import { formatWeightKgForDisplay } from "@/app/lib/carryWeightUtils";

type Props = {
  item: ItemBrowseDetailFields | null;
  onClose: () => void;
};

/** Compact template preview above the create-unique modal (mobile-friendly bottom sheet on small screens). */
export function ItemTemplatePeekModal({ item, onClose }: Props) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-peek-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(70vh,28rem)] w-full max-w-sm flex-col overflow-hidden rounded-t-2xl border-2 border-white border-b-0 bg-modalBackground-200 shadow-xl sm:rounded-2xl sm:border-b-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-paleBlue/30 sm:hidden" />
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-white/20 px-4 pb-3 pt-2 sm:pt-3">
          <h2
            id="template-peek-title"
            className="min-w-0 pr-2 text-base font-semibold leading-snug text-white"
          >
            {item.name}
          </h2>
          <Button
            type="button"
            variant="modalClose"
            fullWidth={false}
            onClick={onClose}
            aria-label="Close"
          >
            <span className="text-lg leading-none">×</span>
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3 space-y-2.5 text-xs text-white/90">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-white/50">
                Type
              </span>
              <p className="mt-0.5 text-white">{item.type}</p>
            </div>
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-white/50">
                Weight
              </span>
              <p className="mt-0.5 text-white">
                {item.weight != null
                  ? `${formatWeightKgForDisplay(item.weight)} kg`
                  : "—"}
              </p>
            </div>
          </div>

          <div>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-white/50">
              Cost
            </span>
            <p className="mt-0.5 text-white">
              {item.confCost != null
                ? `${item.confCost}${item.costInfo ? ` (${item.costInfo})` : ""}`
                : "—"}
            </p>
          </div>

          {item.maxUses != null && (
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-white/50">
                Max uses
              </span>
              <p className="mt-0.5 text-white">{item.maxUses}</p>
            </div>
          )}

          {item.equippable ? (
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-white/50">
                Equippable
              </span>
              <p className="mt-0.5 text-white">
                Yes
                {item.equipSlotTypes?.length
                  ? ` · ${item.equipSlotTypes.join(", ")}`
                  : ""}
              </p>
            </div>
          ) : null}

          {item.description?.trim() ? (
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-white/50">
                Description
              </span>
              <p className="mt-0.5 whitespace-pre-wrap text-white">
                {item.description}
              </p>
            </div>
          ) : null}

          {item.usage?.trim() ? (
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-white/50">
                Usage
              </span>
              <p className="mt-0.5 whitespace-pre-wrap text-white">
                {item.usage}
              </p>
            </div>
          ) : null}

          {item.notes?.trim() ? (
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-white/50">
                Notes
              </span>
              <p className="mt-0.5 whitespace-pre-wrap text-white">
                {item.notes}
              </p>
            </div>
          ) : null}

          {item.type === "WEAPON" &&
          item.attackRoll &&
          item.attackRoll.length > 0 ? (
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-white/50">
                Attack
              </span>
              <p className="mt-0.5 text-white">{item.attackRoll.join(", ")}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
