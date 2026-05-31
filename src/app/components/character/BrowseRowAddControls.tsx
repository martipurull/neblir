"use client";

import { bumpNumericFieldValue } from "@/app/components/shared/bumpNumericFieldValue";
import { Button } from "@/app/components/shared/Button";
import { useState } from "react";

const MAX_ADD_QUANTITY = 10;

const qtyStepButtonClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded border border-white/30 bg-transparent text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50 disabled:pointer-events-none disabled:opacity-40";

const qtyInputClass =
  "h-7 w-10 shrink-0 appearance-none rounded border border-white/30 bg-transparent px-0 text-center text-xs tabular-nums text-white outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-40 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function parseAddQuantity(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_ADD_QUANTITY);
}

type BrowseRowAddControlsProps = {
  itemName: string;
  disabled?: boolean;
  isAdding?: boolean;
  onAdd: (quantity: number) => void | Promise<void>;
};

export function BrowseRowAddControls({
  itemName,
  disabled = false,
  isAdding = false,
  onAdd,
}: BrowseRowAddControlsProps) {
  const [expanded, setExpanded] = useState(false);
  const [qty, setQty] = useState("1");

  const quantity = parseAddQuantity(qty);
  const busy = disabled || isAdding;

  const handlePlus = () => {
    if (!expanded) {
      setExpanded(true);
      return;
    }
    setQty(bumpNumericFieldValue(qty, 1, 1, MAX_ADD_QUANTITY, 1));
  };

  const handleMinus = () => {
    const next = bumpNumericFieldValue(qty, -1, 1, MAX_ADD_QUANTITY, 1);
    if (parseAddQuantity(next) <= 1) {
      setExpanded(false);
      setQty("1");
    } else {
      setQty(next);
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="semanticSafeOutline"
        fullWidth={false}
        disabled={busy}
        onClick={() => void onAdd(quantity)}
        className="!px-2 !py-1 !text-xs"
      >
        {isAdding ? "Adding…" : quantity > 1 ? `Add ×${quantity}` : "Add"}
      </Button>
      {expanded ? (
        <>
          <button
            type="button"
            className={qtyStepButtonClass}
            disabled={busy}
            aria-label={`Decrease quantity of ${itemName}`}
            onClick={handleMinus}
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_ADD_QUANTITY}
            step={1}
            value={qty}
            disabled={busy}
            aria-label={`Quantity of ${itemName} to add`}
            className={qtyInputClass}
            onChange={(e) => setQty(e.target.value)}
            onBlur={() => {
              setQty(String(parseAddQuantity(qty)));
            }}
          />
          <button
            type="button"
            className={qtyStepButtonClass}
            disabled={busy}
            aria-label={`Increase quantity of ${itemName}`}
            onClick={handlePlus}
          >
            +
          </button>
        </>
      ) : (
        <button
          type="button"
          className={qtyStepButtonClass}
          disabled={busy}
          aria-label={`Choose quantity of ${itemName} to add`}
          aria-expanded={false}
          onClick={handlePlus}
        >
          +
        </button>
      )}
    </div>
  );
}
