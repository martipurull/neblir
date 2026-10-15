"use client";

import { Button } from "@/app/components/shared/Button";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { NumberField } from "@/app/components/shared/NumberField";
import { SelectField } from "@/app/components/shared/SelectField";
import type { CurrencyExchangeQuote } from "@/app/lib/types/item";
import { useAutoFocusInput } from "@/hooks/use-auto-focus-input";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useRef, useState } from "react";

type ExchangeDestination = {
  id: string;
  name: string;
};

type ShownQuote = {
  destinationCurrencyId: string;
  amount: number;
  quote: CurrencyExchangeQuote;
};

export type WalletExchangeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sourceName: string;
  currentQuantity: number;
  destinations: readonly ExchangeDestination[];
  onQuote: (
    destinationCurrencyId: string,
    amount: number
  ) => Promise<CurrencyExchangeQuote>;
  onCommit: (destinationCurrencyId: string, amount: number) => Promise<void>;
};

export function WalletExchangeModal({
  isOpen,
  onClose,
  sourceName,
  currentQuantity,
  destinations,
  onQuote,
  onCommit,
}: WalletExchangeModalProps) {
  const [destinationId, setDestinationId] = useState(destinations[0]?.id ?? "");
  const [amount, setAmount] = useState(1);
  const [shownQuote, setShownQuote] = useState<ShownQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);

  useAutoFocusInput(amountInputRef, isOpen);

  const destinationName =
    destinations.find((destination) => destination.id === destinationId)
      ?.name ?? "";
  const isValid = amount >= 1 && Number.isInteger(amount);
  const exceedsHolding = amount > currentQuantity;
  const currentQuote =
    shownQuote?.destinationCurrencyId === destinationId &&
    shownQuote.amount === amount
      ? shownQuote.quote
      : null;

  const handleAmountChange = (value: string) => {
    const parsed = parseInt(value, 10);
    setError(null);
    if (value === "" || Number.isNaN(parsed) || parsed < 0) {
      setAmount(0);
      return;
    }
    setAmount(parsed);
  };

  const handleShowQuote = async () => {
    if (!isValid || exceedsHolding || !destinationId) return;
    setError(null);
    setIsQuoting(true);
    try {
      const quote = await onQuote(destinationId, amount);
      setShownQuote({
        destinationCurrencyId: destinationId,
        amount,
        quote,
      });
    } catch (caught) {
      setShownQuote(null);
      setError(getUserSafeErrorMessage(caught, "Could not show this exchange"));
    } finally {
      setIsQuoting(false);
    }
  };

  const handleCommit = async () => {
    if (!currentQuote || !destinationId) return;
    setError(null);
    setIsCommitting(true);
    try {
      await onCommit(destinationId, amount);
      onClose();
    } catch (caught) {
      setError(getUserSafeErrorMessage(caught, "Could not exchange"));
    } finally {
      setIsCommitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-exchange-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            id="wallet-exchange-modal-title"
            className="text-lg font-semibold text-white"
          >
            Exchange
          </h2>
          <Button
            type="button"
            variant="modalClose"
            fullWidth={false}
            onClick={onClose}
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </Button>
        </div>

        <p className="mt-2 text-sm text-white/80">{sourceName}</p>

        <div className="mt-4">
          <FieldLabel
            id="wallet-exchange-destination"
            label="Destination"
            required
            variant="dark"
          />
          <SelectField
            id="wallet-exchange-destination"
            variant="dark"
            value={destinationId}
            onChange={(value) => {
              setDestinationId(value);
              setError(null);
            }}
            options={destinations.map((destination) => ({
              value: destination.id,
              label: destination.name,
            }))}
            disabled={destinations.length === 0 || isQuoting || isCommitting}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-white">Amount</span>
          <NumberField
            ref={amountInputRef}
            variant="dark"
            min={0}
            step={1}
            value={amount || ""}
            onChange={handleAmountChange}
            className="h-9 w-20"
            inputClassName="text-center text-sm font-bold"
            stepperLabel="Amount"
            aria-label="Amount"
          />
        </div>

        {!error && !isValid ? (
          <p className="mt-2 text-sm text-white/80">
            Enter a positive integer.
          </p>
        ) : null}
        {!error && isValid && exceedsHolding ? (
          <p className="mt-2 text-sm text-white/80">
            You only have {currentQuantity}.
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm text-neblirDanger-400">{error}</p>
        ) : null}

        <Button
          type="button"
          variant="modalPaleOutline"
          className="mt-5"
          onClick={() => {
            void handleShowQuote();
          }}
          disabled={
            !isValid ||
            exceedsHolding ||
            !destinationId ||
            isQuoting ||
            isCommitting
          }
        >
          {isQuoting ? "Please wait…" : "Show exchange"}
        </Button>

        {currentQuote ? (
          <>
            <div className="mt-4 space-y-1 text-sm text-white">
              <p>
                {sourceName} exchange value {currentQuote.sourceExchangeValue}
              </p>
              <p>
                {destinationName} exchange value{" "}
                {currentQuote.destinationExchangeValue}
              </p>
              <p>
                {currentQuote.destinationQuantity} {destinationName}
              </p>
            </div>
            <Button
              type="button"
              variant="modalMutedPrimary"
              className="mt-4"
              onClick={() => {
                void handleCommit();
              }}
              disabled={isQuoting || isCommitting}
            >
              {isCommitting ? "Please wait…" : "Exchange"}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
