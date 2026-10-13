import type { Theme as PrismaTheme } from "@prisma/client";
import type { CSSProperties } from "react";
import {
  CUSTOM_SECONDARY,
  DANGER_200,
  DANGER_400,
  DANGER_600,
  DARK_CARD,
  DARK_CARD_HOVER,
  DARK_MODAL,
  DARK_MODAL_400,
  DARK_MODAL_600,
  DARK_PAGE,
  DARK_TEXT,
  DARK_WARNING_200,
  DARK_WARNING_400,
  DARK_WARNING_600,
  DEEP_BRAND_PURPLE,
  LIGHT_CARD,
  LIGHT_CARD_HOVER,
  LIGHT_DANGER_600,
  LIGHT_MODAL,
  LIGHT_MODAL_400,
  LIGHT_MODAL_600,
  LIGHT_PAGE,
  LIGHT_SAFE_600,
  LIGHT_TEXT,
  LIGHT_WARNING_600,
  NEBLIR_MODAL_400,
  NEBLIR_MODAL_600,
  NEBLIR_MODAL_SHELL,
  NEBLIR_PAGE_GRADIENT,
  NEBLIR_PALE_BLUE,
  NEBLIR_PALE_BLUE_HOVER,
  NEBLIR_TEXT,
  SAFE_200,
  SAFE_400,
  SAFE_600,
  WARNING_200,
  WARNING_400,
  WARNING_600,
} from "@/app/lib/themeColors";

export const THEME_VALUES = ["neblir", "dark", "light"] as const;
export type Theme = (typeof THEME_VALUES)[number];

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
  200: SAFE_200,
  400: SAFE_400,
  600: SAFE_600,
};
const NEBLIR_WARNING: SemanticStops = {
  200: WARNING_200,
  400: WARNING_400,
  600: WARNING_600,
};
const NEBLIR_DANGER: SemanticStops = {
  200: DANGER_200,
  400: DANGER_400,
  600: DANGER_600,
};
const DARK_WARNING: SemanticStops = {
  200: DARK_WARNING_200,
  400: DARK_WARNING_400,
  600: DARK_WARNING_600,
};
const LIGHT_SAFE: SemanticStops = {
  200: SAFE_200,
  400: SAFE_600,
  600: LIGHT_SAFE_600,
};
const LIGHT_WARNING: SemanticStops = {
  200: WARNING_200,
  400: WARNING_600,
  600: LIGHT_WARNING_600,
};
const LIGHT_DANGER: SemanticStops = {
  200: DANGER_200,
  400: DANGER_600,
  600: LIGHT_DANGER_600,
};

const THEME_PAINT: Record<Theme, ThemePaint> = {
  neblir: {
    page: NEBLIR_PAGE_GRADIENT,
    card: NEBLIR_PALE_BLUE,
    cardHover: NEBLIR_PALE_BLUE_HOVER,
    modal: NEBLIR_MODAL_SHELL,
    modal400: NEBLIR_MODAL_400,
    modal600: NEBLIR_MODAL_600,
    text: NEBLIR_TEXT,
    accent: DEEP_BRAND_PURPLE,
    toolbar: DEEP_BRAND_PURPLE,
    safe: NEBLIR_SAFE,
    warning: NEBLIR_WARNING,
    danger: NEBLIR_DANGER,
  },
  dark: {
    page: DARK_PAGE,
    card: DARK_CARD,
    cardHover: DARK_CARD_HOVER,
    modal: DARK_MODAL,
    modal400: DARK_MODAL_400,
    modal600: DARK_MODAL_600,
    text: DARK_TEXT,
    accent: DEEP_BRAND_PURPLE,
    toolbar: DARK_PAGE,
    safe: NEBLIR_SAFE,
    warning: DARK_WARNING,
    danger: NEBLIR_DANGER,
  },
  light: {
    page: LIGHT_PAGE,
    card: LIGHT_CARD,
    cardHover: LIGHT_CARD_HOVER,
    modal: LIGHT_MODAL,
    modal400: LIGHT_MODAL_400,
    modal600: LIGHT_MODAL_600,
    text: LIGHT_TEXT,
    accent: DEEP_BRAND_PURPLE,
    toolbar: LIGHT_PAGE,
    safe: LIGHT_SAFE,
    warning: LIGHT_WARNING,
    danger: LIGHT_DANGER,
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
  return (THEME_VALUES as readonly string[]).includes(value);
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
): PrismaTheme | undefined {
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
    "--theme-on-accent-rgb": hexToRgbChannels(CUSTOM_SECONDARY),
    "--theme-white-rgb":
      theme === "neblir" ? "255 255 255" : hexToRgbChannels(paint.text),
    "--theme-modal-ink-rgb":
      theme === "neblir"
        ? hexToRgbChannels(NEBLIR_MODAL_SHELL)
        : hexToRgbChannels(paint.text),
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
