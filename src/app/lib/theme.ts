import type { CSSProperties } from "react";

export const THEME_VALUES = ["neblir", "dark", "light"] as const;
export type Theme = (typeof THEME_VALUES)[number];

export type StoredTheme = "NEBLIR" | "DARK" | "LIGHT";

export type ThemeTokens = {
  page: string;
  card: string;
  modal: string;
  text: string;
  accent: string;
  safe: string;
  warning: string;
  danger: string;
  toolbar: string;
};

const DEEP_BRAND_PURPLE = "#421161";
const NEBLIR_PAGE_GRADIENT =
  "radial-gradient(circle, #d227ad, #581659, #2541b2)";
const NEBLIR_MODAL_SHELL = "#4a3d5e";

type SemanticStops = {
  200: string;
  400: string;
  600: string;
};

type ThemePaint = {
  page: string;
  card: string;
  cardHover: string;
  modal: string;
  modal400: string;
  modal600: string;
  text: string;
  accent: string;
  toolbar: string;
  safe: SemanticStops;
  warning: SemanticStops;
  danger: SemanticStops;
};

const NEBLIR_SAFE: SemanticStops = {
  200: "#bbf7d0",
  400: "#86efac",
  600: "#4ade80",
};
const NEBLIR_WARNING: SemanticStops = {
  200: "#fde68a",
  400: "#fcd34d",
  600: "#eab308",
};
const NEBLIR_DANGER: SemanticStops = {
  200: "#fecaca",
  400: "#fca5a5",
  600: "#f87171",
};

const THEME_PAINT: Record<Theme, ThemePaint> = {
  neblir: {
    page: NEBLIR_PAGE_GRADIENT,
    card: "#dbeafe",
    cardHover: "#bfdbfe",
    modal: NEBLIR_MODAL_SHELL,
    modal400: "#6b21a8",
    modal600: "#8b5cf6",
    text: "#000000",
    accent: DEEP_BRAND_PURPLE,
    toolbar: DEEP_BRAND_PURPLE,
    safe: NEBLIR_SAFE,
    warning: NEBLIR_WARNING,
    danger: NEBLIR_DANGER,
  },
  dark: {
    page: "#16161a",
    card: "#23232a",
    cardHover: "#2c2c34",
    modal: "#31313a",
    modal400: "#3d3d48",
    modal600: "#494954",
    text: "#f4f4f5",
    accent: DEEP_BRAND_PURPLE,
    toolbar: "#16161a",
    safe: { 200: "#bbf7d0", 400: "#86efac", 600: "#4ade80" },
    warning: { 200: "#fef3c7", 400: "#fde047", 600: "#facc15" },
    danger: { 200: "#fecaca", 400: "#fca5a5", 600: "#f87171" },
  },
  light: {
    page: "#f4f3ef",
    card: "#ffffff",
    cardHover: "#f7f6f3",
    modal: "#e6e4dd",
    modal400: "#d9d6ce",
    modal600: "#ccc9c0",
    text: "#1c1c1f",
    accent: DEEP_BRAND_PURPLE,
    toolbar: "#f4f3ef",
    safe: { 200: "#bbf7d0", 400: "#4ade80", 600: "#15803d" },
    warning: { 200: "#fde68a", 400: "#eab308", 600: "#a16207" },
    danger: { 200: "#fecaca", 400: "#f87171", 600: "#dc2626" },
  },
};

const STORED_TO_THEME: Record<string, Theme> = {
  neblir: "neblir",
  NEBLIR: "neblir",
  dark: "dark",
  DARK: "dark",
  light: "light",
  LIGHT: "light",
};

export function isTheme(value: string): value is Theme {
  return value === "neblir" || value === "dark" || value === "light";
}

/** Turns a stored user value into a Theme. Absent, empty, and unknown resolve to Neblir. */
export function resolveTheme(stored: string | null | undefined): Theme {
  if (stored == null || stored === "") return "neblir";
  return STORED_TO_THEME[stored] ?? "neblir";
}

export function resolveDocumentTheme(input: {
  hasSession: boolean;
  stored?: string | null;
}): Theme {
  if (!input.hasSession) return "neblir";
  return resolveTheme(input.stored);
}

export function themeTokens(theme: Theme): ThemeTokens {
  const paint = THEME_PAINT[theme];
  return {
    page: paint.page,
    card: paint.card,
    modal: paint.modal,
    text: paint.text,
    accent: paint.accent,
    safe: paint.safe[600],
    warning: paint.warning[600],
    danger: paint.danger[600],
    toolbar: paint.toolbar,
  };
}

export function toDbTheme(
  theme: Theme | null | undefined
): StoredTheme | undefined {
  if (theme === "neblir") return "NEBLIR";
  if (theme === "dark") return "DARK";
  if (theme === "light") return "LIGHT";
  return undefined;
}

function hexToRgbChannels(hex: string): string {
  const raw = hex.slice(1);
  const red = Number.parseInt(raw.slice(0, 2), 16);
  const green = Number.parseInt(raw.slice(2, 4), 16);
  const blue = Number.parseInt(raw.slice(4, 6), 16);
  return `${red} ${green} ${blue}`;
}

/** CSS variables the document sets from the active Theme. Neblir values match today's colors. */
export function themeDocumentStyle(theme: Theme): CSSProperties {
  const paint = THEME_PAINT[theme];
  return {
    "--theme-page": paint.page,
    "--theme-card-rgb": hexToRgbChannels(paint.card),
    "--theme-card-hover-rgb": hexToRgbChannels(paint.cardHover),
    "--theme-modal-rgb": hexToRgbChannels(paint.modal),
    "--theme-modal-400-rgb": hexToRgbChannels(paint.modal400),
    "--theme-modal-600-rgb": hexToRgbChannels(paint.modal600),
    "--theme-text-rgb": hexToRgbChannels(paint.text),
    "--theme-accent-rgb": hexToRgbChannels(paint.accent),
    "--theme-safe-200-rgb": hexToRgbChannels(paint.safe[200]),
    "--theme-safe-400-rgb": hexToRgbChannels(paint.safe[400]),
    "--theme-safe-600-rgb": hexToRgbChannels(paint.safe[600]),
    "--theme-warning-200-rgb": hexToRgbChannels(paint.warning[200]),
    "--theme-warning-400-rgb": hexToRgbChannels(paint.warning[400]),
    "--theme-warning-600-rgb": hexToRgbChannels(paint.warning[600]),
    "--theme-danger-200-rgb": hexToRgbChannels(paint.danger[200]),
    "--theme-danger-400-rgb": hexToRgbChannels(paint.danger[400]),
    "--theme-danger-600-rgb": hexToRgbChannels(paint.danger[600]),
  } as CSSProperties;
}
