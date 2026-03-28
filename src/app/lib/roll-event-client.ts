"use client";

import type { RollEventPayload } from "@/app/lib/types/roll-event";
import { emitGameRollEvent } from "@/lib/api/game";

export async function emitRollEvent(
  gameId: string | null | undefined,
  payload: RollEventPayload
): Promise<void> {
  if (!gameId) return;
  try {
    await emitGameRollEvent(gameId, payload);
  } catch {
    // Non-blocking: gameplay roll UI should not fail if Discord publishing fails.
  }
}
