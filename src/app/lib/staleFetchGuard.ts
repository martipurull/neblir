/**
 * Drops in-flight fetch results that completed after a newer local write or fetch
 * started, so stale HTTP responses cannot overwrite fresher cache.
 */
export type StaleFetchGuard<T> = {
  beginFetch: () => number;
  resolveFetch: (requestSeq: number, data: T) => T;
  applyLocal: (data: T) => void;
  getCache: () => T | null;
};

export function createStaleFetchGuard<T>(): StaleFetchGuard<T> {
  let seq = 0;
  let cache: T | null = null;

  return {
    beginFetch() {
      seq += 1;
      return seq;
    },
    resolveFetch(requestSeq, data) {
      if (requestSeq !== seq) {
        return cache ?? data;
      }
      cache = data;
      return data;
    },
    applyLocal(data) {
      seq += 1;
      cache = data;
    },
    getCache() {
      return cache;
    },
  };
}
