"use client";

import { bumpNumericFieldValue } from "@/app/components/shared/bumpNumericFieldValue";
import { Button } from "@/app/components/shared/Button";
import { NumberField } from "@/app/components/shared/NumberField";
import { useState } from "react";

const MAX_ADD_QUANTITY = 10;

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
          <Button
            type="button"
            variant="modalIconStepperCompact"
            fullWidth={false}
            disabled={busy}
            aria-label={`Decrease quantity of ${itemName}`}
            onClick={handleMinus}
          >
            −
          </Button>
          <NumberField
            variant="dark"
            density="compact"
            min={1}
            max={MAX_ADD_QUANTITY}
            step={1}
            value={qty}
            disabled={busy}
            aria-label={`Quantity of ${itemName} to add`}
            onChange={setQty}
            onBlur={() => {
              setQty(String(parseAddQuantity(qty)));
            }}
          />
          <Button
            type="button"
            variant="modalIconStepperCompact"
            fullWidth={false}
            disabled={busy}
            aria-label={`Increase quantity of ${itemName}`}
            onClick={handlePlus}
          >
            +
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="modalIconStepperCompact"
          fullWidth={false}
          disabled={busy}
          aria-label={`Choose quantity of ${itemName} to add`}
          aria-expanded={false}
          onClick={handlePlus}
        >
          +
        </Button>
      )}
    </div>
  );
}
