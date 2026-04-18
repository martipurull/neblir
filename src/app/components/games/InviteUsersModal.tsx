"use client";

import { ModalShell } from "@/app/components/shared/ModalShell";
import {
  getUserSafeApiError,
  getUserSafeErrorMessage,
} from "@/lib/userSafeError";
import React, { useState } from "react";

type InviteResult = {
  invitedEmails: string[];
  notFound: string[];
  alreadyInGame: string[];
  alreadyInvited: string[];
  isSelf: string[];
};

type InviteUsersModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  onClose: () => void;
  onSuccess?: () => void;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(s: string): boolean {
  return emailRegex.test(s.trim());
}

const InviteUsersModal: React.FC<InviteUsersModalProps> = ({
  isOpen,
  gameId,
  gameName,
  onClose,
  onSuccess,
}) => {
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResult | null>(null);

  const addEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!isValidEmail(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (emails.includes(trimmed)) {
      setError("That email is already in the list.");
      return;
    }
    setError(null);
    setEmails((prev) => [...prev, trimmed]);
    setEmailInput("");
  };

  const removeEmail = (email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email));
    setResult(null);
  };

  const handleSubmit = async () => {
    if (emails.length === 0) {
      setError("Add at least one email address.");
      return;
    }
    setError(null);
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/games/${encodeURIComponent(gameId)}/invites`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(
          getUserSafeApiError(
            res.status,
            data as { message?: string; details?: string },
            "Failed to send invites."
          )
        );
        return;
      }
      setResult(data as InviteResult);
      if (data.invitedEmails?.length > 0) {
        setEmails((prev) =>
          prev.filter((e) => !data.invitedEmails.includes(e))
        );
        onSuccess?.();
      }
      if (data.invitedEmails?.length === emails.length && emails.length > 0) {
        setTimeout(() => {
          onClose();
        }, 2500);
      }
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to send invites."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmailInput("");
    setEmails([]);
    setError(null);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={handleClose}
      title={`Invite users to ${gameName}`}
      titleId="invite-users-title"
      subtitle="Add email addresses below. They must already have an account."
      closeDisabled={submitting}
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-md border-2 border-white bg-transparent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-paleBlue/10 disabled:opacity-50"
          >
            {result && emails.length === 0 ? "Close" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || emails.length === 0}
            className="rounded-md border-2 border-white bg-paleBlue px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-paleBlue/90 disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Invite to game"}
          </button>
        </div>
      }
    >
      <>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addEmail())
            }
            placeholder="email@example.com"
            className="min-w-0 flex-1 rounded border-2 border-white bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Email address"
            disabled={submitting}
          />
          <button
            type="button"
            onClick={addEmail}
            disabled={submitting}
            className="shrink-0 rounded-md border-2 border-white bg-transparent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-paleBlue/10 disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {emails.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-white/70">
              To invite ({emails.length})
            </p>
            <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto rounded border border-white/30 bg-paleBlue/5 p-2">
              {emails.map((email) => (
                <li
                  key={email}
                  className="flex items-center justify-between gap-2 text-sm text-white"
                >
                  <span className="truncate">{email}</span>
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    disabled={submitting}
                    className="shrink-0 text-xs text-white/70 underline hover:text-white disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-neblirDanger-400">{error}</p>}

        {result && (
          <div className="mt-3 rounded border border-white/30 bg-black/20 p-3 text-sm text-white">
            {result.invitedEmails.length > 0 && (
              <p className="font-medium text-neblirSafe-400">
                Invited: {result.invitedEmails.join(", ")}
              </p>
            )}
            {result.notFound.length > 0 && (
              <p className="mt-1 text-white/90">
                No account: {result.notFound.join(", ")}
              </p>
            )}
            {result.alreadyInGame.length > 0 && (
              <p className="mt-1 text-white/90">
                Already in game: {result.alreadyInGame.join(", ")}
              </p>
            )}
            {result.alreadyInvited.length > 0 && (
              <p className="mt-1 text-white/90">
                Already invited: {result.alreadyInvited.join(", ")}
              </p>
            )}
            {result.isSelf.length > 0 && (
              <p className="mt-1 text-white/90">
                Can&apos;t invite yourself: {result.isSelf.join(", ")}
              </p>
            )}
          </div>
        )}
      </>
    </ModalShell>
  );
};

export default InviteUsersModal;
