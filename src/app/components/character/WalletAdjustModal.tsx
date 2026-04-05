"use client";

import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import React, { useState, useEffect } from "react";

export type WalletAdjustMode = "add" | "subtract";

export interface WalletAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: WalletAdjustMode;
  currencyName: string;
  currentQuantity: number;
  onSubmit: (amount: number) => Promise<void>;
}

export function WalletAdjustModal({
  isOpen,
  onClose,
  mode,
  currencyName,
  currentQuantity,
  onSubmit,
}: WalletAdjustModalProps) {
  const [amount, setAmount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(1);
      setError(null);
    }
  }, [isOpen]);

  const handleAmountChange = (value: string) => {
    const parsed = parseInt(value, 10);
    if (value === "") {
      setAmount(0);
      setError(null);
      return;
    }
    if (Number.isNaN(parsed) || parsed < 0) {
      setAmount(0);
      setError("Must be a positive integer");
      return;
    }
    setAmount(parsed);
    setError(null);
  };

  const handleAdjust = (delta: number) => {
    const newVal = Math.max(0, amount + delta);
    setAmount(newVal);
    setError(null);
  };

  const isValid = amount >= 1 && Number.isInteger(amount);
  const subtractExceedsBalance =
    mode === "subtract" && amount > currentQuantity;

  const handleSubmit = async () => {
    if (!isValid || subtractExceedsBalance) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(amount);
      onClose();
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Something went wrong"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const title =
    mode === "add" ? "Add money to wallet" : "Subtract money from wallet";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-adjust-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            id="wallet-adjust-modal-title"
            className="text-lg font-semibold text-white"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white transition-colors hover:bg-paleBlue/10"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <p className="mt-2 text-sm text-white/80">{currencyName}</p>

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-white">Amount</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAdjust(-1)}
              disabled={amount <= 0}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-white bg-transparent text-lg font-bold text-white transition-colors hover:bg-paleBlue/10 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease amount"
            >
              −
            </button>
            <input
              type="number"
              min={0}
              step={1}
              value={amount || ""}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="h-9 w-20 rounded-md border-2 border-white bg-transparent px-2 text-center text-sm font-bold text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Amount"
            />
            <button
              type="button"
              onClick={() => handleAdjust(1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-white bg-transparent text-lg font-bold text-white transition-colors hover:bg-paleBlue/10"
              aria-label="Increase amount"
            >
              +
            </button>
          </div>
        </div>

        {!error &&
          (amount < 1 ? (
            <p className="mt-2 text-sm text-white/80">
              Enter a positive integer.
            </p>
          ) : (
            mode === "subtract" &&
            amount > currentQuantity && (
              <p className="mt-2 text-sm text-white/80">
                You only have {currentQuantity}. Cannot subtract more.
              </p>
            )
          ))}

        {error && <p className="mt-2 text-sm text-neblirDanger-400">{error}</p>}

        <button
          type="button"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={!isValid || subtractExceedsBalance || isSubmitting}
          className="mt-5 w-full rounded-md border-2 border-white bg-paleBlue/10 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-paleBlue/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Please wait…"
            : mode === "add"
              ? "Add money to wallet"
              : "Subtract money from wallet"}
        </button>
      </div>
    </div>
  );
}
