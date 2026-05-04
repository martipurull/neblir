"use client";

import Button from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { importCustomEnemiesCsv } from "@/lib/api/customEnemies";
import { useCallback, useState } from "react";

type ImportCustomEnemiesModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export function ImportCustomEnemiesModal({
  isOpen,
  gameId,
  gameName,
  onClose,
  onSuccess,
}: ImportCustomEnemiesModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setFile(null);
    setError(null);
    setResultText(null);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }
    setError(null);
    setResultText(null);
    setBusy(true);
    try {
      const res = await importCustomEnemiesCsv(gameId, file);
      const errLines =
        res.rowErrors?.length > 0
          ? `\n\nIssues:\n${res.rowErrors
              .slice(0, 12)
              .map((e) => `Line ${e.line}: ${e.message}`)
              .join("\n")}${res.rowErrors.length > 12 ? "\n…" : ""}`
          : "";
      setResultText(
        `Created ${res.created}. Skipped or failed rows: ${res.skipped}.${errLines}`
      );
      await onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }, [file, gameId, onSuccess]);

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={handleClose}
      title={`Import custom enemies — ${gameName}`}
      titleId="import-custom-enemies-title"
      maxWidthClass="max-w-md"
    >
      <p className="text-sm text-white/85">
        CSV must include a header row with the same columns as an export from
        this app (name, stats, pipe-separated damage types, etc.).
      </p>
      <div className="mt-4">
        <label
          className="block text-xs font-medium text-white/80"
          htmlFor="enemy-csv-file"
        >
          CSV file
        </label>
        <input
          id="enemy-csv-file"
          type="file"
          accept=".csv,text/csv"
          className="mt-1 block w-full text-sm text-white file:mr-2 file:rounded file:border-0 file:bg-paleBlue/10 file:px-3 file:py-1.5 file:text-sm file:text-white"
          disabled={busy}
          onChange={(ev) => {
            const f = ev.target.files?.[0] ?? null;
            setFile(f);
            setResultText(null);
            setError(null);
          }}
        />
      </div>
      {error ? (
        <p className="mt-3 text-sm text-neblirDanger-300">{error}</p>
      ) : null}
      {resultText ? (
        <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-white/15 bg-black/30 p-2 text-xs text-white/90">
          {resultText}
        </pre>
      ) : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="secondaryOutlineXs"
          onClick={handleClose}
          disabled={busy}
        >
          Close
        </Button>
        <Button
          type="button"
          variant="semanticWarningOutline"
          onClick={() => void handleSubmit()}
          disabled={busy || !file}
        >
          {busy ? "Importing…" : "Import"}
        </Button>
      </div>
    </ModalShell>
  );
}
