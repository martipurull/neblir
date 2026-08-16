import { createStaleFetchGuard } from "@/app/lib/staleFetchGuard";
import { describe, expect, it } from "vitest";

describe("createStaleFetchGuard", () => {
  it("keeps the latest matching fetch result", () => {
    const guard = createStaleFetchGuard<string>();
    const seq = guard.beginFetch();
    expect(guard.resolveFetch(seq, "fresh")).toBe("fresh");
    expect(guard.getCache()).toBe("fresh");
  });

  it("discards an in-flight fetch after a newer fetch starts", () => {
    const guard = createStaleFetchGuard<string>();
    const first = guard.beginFetch();
    const second = guard.beginFetch();
    expect(guard.resolveFetch(second, "second")).toBe("second");
    expect(guard.resolveFetch(first, "first")).toBe("second");
    expect(guard.getCache()).toBe("second");
  });

  it("discards an in-flight fetch after a local write", () => {
    const guard = createStaleFetchGuard<string>();
    guard.applyLocal("seed");
    const inFlight = guard.beginFetch();
    guard.applyLocal("local");
    expect(guard.resolveFetch(inFlight, "stale-http")).toBe("local");
    expect(guard.getCache()).toBe("local");
  });

  it("returns the incoming data when a stale fetch has no cache yet", () => {
    const guard = createStaleFetchGuard<string>();
    const first = guard.beginFetch();
    guard.beginFetch();
    expect(guard.resolveFetch(first, "late")).toBe("late");
    expect(guard.getCache()).toBeNull();
  });
});
