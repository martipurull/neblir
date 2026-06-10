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

/** Bump a numeric string for ± stepper controls (shared by light and modal number fields). */
export function bumpNumericFieldValue(
  raw: string,
  direction: 1 | -1,
  min?: number,
  max?: number,
  step = 1
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
    const decPart = step.toString().split(".")[1];
    const decimals = decPart ? decPart.length : 1;
    return Number(next.toFixed(decimals)).toString();
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
