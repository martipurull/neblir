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
