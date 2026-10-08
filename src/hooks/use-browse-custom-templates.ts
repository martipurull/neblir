import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useCallback, useEffect, useState } from "react";

/** Loads one game's custom templates for a Browse modal and keeps the row
 * selection across refreshes. `fetchRows` must be stable (a module function). */
export function useBrowseCustomTemplates<T extends { id: string }>(
  gameId: string,
  fetchRows: (gameId: string) => Promise<T[]>,
  loadErrorMessage: string
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");

  const applyRows = useCallback((next: T[]) => {
    setError(null);
    setRows(next);
    setSelectedId((curr) => curr || (next[0]?.id ?? ""));
  }, []);

  const applyFailure = useCallback(
    (e: unknown) => {
      setError(getUserSafeErrorMessage(e, loadErrorMessage));
      setRows([]);
    },
    [loadErrorMessage]
  );

  useEffect(() => {
    let cancelled = false;
    void fetchRows(gameId)
      .then(
        (next) => {
          if (!cancelled) applyRows(next);
        },
        (e: unknown) => {
          if (!cancelled) applyFailure(e);
        }
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyFailure, applyRows, fetchRows, gameId]);

  const refresh = useCallback(
    () => fetchRows(gameId).then(applyRows, applyFailure),
    [applyFailure, applyRows, fetchRows, gameId]
  );

  return { rows, loading, error, selectedId, setSelectedId, refresh };
}
