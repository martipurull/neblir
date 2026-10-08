/** True when the text is not yet a finished number ("-", "1.", "."). */
export function isIncompleteNumericText(raw: string): boolean {
  const trimmed = raw.trim();
  return (
    trimmed === "-" ||
    trimmed === "." ||
    trimmed === "-." ||
    trimmed.endsWith(".")
  );
}

/**
 * True when typed text is a decimal spelling of `coerced` that
 * `String(coerced)` would shorten ("1.50" → "1.5", "1.0" → "1").
 */
export function shouldKeepDecimalDraft(raw: string, coerced: number): boolean {
  const trimmed = raw.trim();
  if (!trimmed.includes(".")) return false;
  if (!Number.isFinite(coerced)) return false;
  return trimmed !== String(coerced) && Number(trimmed) === coerced;
}

/** True when the field shows integer zero and typing should replace it (not append). */
export function isReplaceableZeroDisplay(value: string): boolean {
  const trimmed = value.trim();
  if (
    !trimmed ||
    trimmed === "-" ||
    trimmed.includes(".") ||
    trimmed.includes(",")
  ) {
    return false;
  }
  const n = Number(trimmed);
  return n === 0 && !Number.isNaN(n);
}

/**
 * When the field shows a lone zero, typing a digit should replace it
 * (e.g. "0" + "5" → "5", not "05"). Preserves decimal entry ("0." stays).
 */
export function normalizeNumericInputOnType(
  previous: string,
  next: string
): string {
  if (!isReplaceableZeroDisplay(previous)) {
    return next;
  }
  const trimmed = next.trim();
  if (trimmed.startsWith("0.") || trimmed.startsWith("0,")) {
    return next;
  }
  if (/^-?0+[1-9]/.test(trimmed)) {
    const sign = next.startsWith("-") ? "-" : "";
    const unsigned = sign ? next.slice(1) : next;
    const stripped = unsigned.replace(/^0+/, "") || "0";
    return sign + stripped;
  }
  return next;
}

function decimalPlaces(raw: string): number {
  const decPart = raw.split(".")[1];
  return decPart ? decPart.length : 0;
}

function formatSteppedNumber(next: number, decimals: number): string {
  if (decimals <= 0) {
    return String(Math.round(next));
  }
  return Number(next.toFixed(decimals)).toString();
}

/** Bump a numeric string for ± stepper controls (shared by light and modal number fields). */
export function bumpNumericFieldValue(
  raw: string,
  direction: 1 | -1,
  min?: number,
  max?: number,
  step = 1,
  /**
   * When true, an integer step keeps a fractional current value
   * (`1.5` + 1 → `2.5`). Default false rounds, so other fields stay unchanged.
   */
  preserveFraction = false
): string {
  const trimmed = raw.trim();
  let n = trimmed === "" ? 0 : Number(trimmed);
  if (Number.isNaN(n)) {
    n = 0;
  }
  let next = n + direction * step;
  if (min != null) {
    next = Math.max(min, next);
  }
  if (max != null) {
    next = Math.min(max, next);
  }
  if (!Number.isInteger(step)) {
    return formatSteppedNumber(next, decimalPlaces(step.toString()) || 1);
  }
  if (preserveFraction && !Number.isInteger(n)) {
    const decimals = decimalPlaces(trimmed);
    if (decimals > 0) {
      return formatSteppedNumber(next, decimals);
    }
  }
  return String(Math.round(next));
}

/** Parse raw input / stepper output into a numeric form value (never a string). */
export function coerceNumericFieldValue(
  raw: string,
  parseAs: "int" | "float",
  min?: number,
  max?: number
): number {
  const fallback = min ?? 0;
  const trimmed = raw.trim();
  if (trimmed === "") {
    return clampNumeric(fallback, min, max);
  }
  let n = parseAs === "float" ? parseFloat(trimmed) : parseInt(trimmed, 10);
  if (Number.isNaN(n)) {
    return clampNumeric(fallback, min, max);
  }
  return clampNumeric(n, min, max);
}

function clampNumeric(n: number, min?: number, max?: number): number {
  let next = n;
  if (min != null) {
    next = Math.max(min, next);
  }
  if (max != null) {
    next = Math.min(max, next);
  }
  return next;
}
