import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getActiveGameStorageKey,
  readStoredActiveGameId,
  writeStoredActiveGameId,
} from "@/app/lib/characterActiveGame";

const storage = vi.hoisted(() => new Map<string, string>());

vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  clear: () => {
    storage.clear();
  },
});

describe("characterActiveGame storage", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("round-trips active game id for a character", () => {
    writeStoredActiveGameId("char-1", "game-b");
    expect(readStoredActiveGameId("char-1", ["game-a", "game-b"])).toBe(
      "game-b"
    );
  });

  it("returns null when stored game is no longer linked", () => {
    writeStoredActiveGameId("char-1", "game-removed");
    expect(readStoredActiveGameId("char-1", ["game-a"])).toBeNull();
  });

  it("uses a per-character storage key", () => {
    expect(getActiveGameStorageKey("char-1")).toBe("neblir:activeGame:char-1");
  });
});
