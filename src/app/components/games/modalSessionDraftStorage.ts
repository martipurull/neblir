export function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function draftStrField(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export function draftBoolOrEmptyField(v: unknown): boolean | "" {
  if (v === true || v === false) return v;
  return "";
}

export function draftStringArrayField(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export function draftHasNonEmptyScalars(fields: string[]): boolean {
  return fields.some((v) => v.trim() !== "");
}

export function buildModalDraftStorageKey(
  flow: string,
  version: number,
  scopeId: string
): string {
  return `neblir:${flow}:v${version}:${scopeId}`;
}

export function readModalSessionDraft<T>({
  storageKey,
  version,
  normalize,
  isMeaningful,
}: {
  storageKey: string;
  version: number;
  normalize: (parsed: Record<string, unknown>) => T | null;
  isMeaningful: (draft: T) => boolean;
}): T | null {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      sessionStorage.removeItem(storageKey);
      return null;
    }
    if (parsed.v !== version) {
      sessionStorage.removeItem(storageKey);
      return null;
    }
    const draft = normalize(parsed);
    if (!draft || !isMeaningful(draft)) {
      sessionStorage.removeItem(storageKey);
      return null;
    }
    return draft;
  } catch {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function persistModalSessionDraft<T>({
  storageKey,
  version,
  draft,
  isMeaningful,
}: {
  storageKey: string;
  version: number;
  draft: T;
  isMeaningful: (draft: T) => boolean;
}): void {
  if (!isMeaningful(draft)) {
    clearModalSessionDraft(storageKey);
    return;
  }
  try {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        v: version,
        ...draft,
      })
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearModalSessionDraft(storageKey: string): void {
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
}
