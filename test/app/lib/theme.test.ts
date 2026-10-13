import { describe, expect, it } from "vitest";
import {
  resolveDocumentTheme,
  resolveTheme,
  themeDocumentStyle,
  themeTokens,
} from "@/app/lib/theme";

const DEEP_BRAND_PURPLE = "#421161";
const NEBLIR_MODAL_SHELL = "#4a3d5e";
const NEBLIR_PAGE_GRADIENT =
  "radial-gradient(circle, #d227ad, #581659, #2541b2)";
const PURPLE_SHELL_FAMILY = ["#4a3d5e", "#6b21a8", "#8b5cf6"];

function expectOpaqueStep(value: string) {
  expect(value).toMatch(/^#[0-9a-f]{6}$/i);
  expect(value.toLowerCase()).not.toContain("gradient");
  expect(PURPLE_SHELL_FAMILY).not.toContain(value.toLowerCase());
}

describe("resolveTheme", () => {
  it("resolves an absent preference to Neblir", () => {
    expect(resolveTheme(null)).toBe("neblir");
    expect(resolveTheme(undefined)).toBe("neblir");
    expect(resolveTheme("")).toBe("neblir");
  });

  it("resolves stored Neblir, Dark, and Light and nothing else", () => {
    expect(resolveTheme("NEBLIR")).toBe("neblir");
    expect(resolveTheme("neblir")).toBe("neblir");
    expect(resolveTheme("DARK")).toBe("dark");
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("LIGHT")).toBe("light");
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("system")).toBe("neblir");
    expect(resolveTheme("device")).toBe("neblir");
  });
});

describe("resolveDocumentTheme", () => {
  it("paints Neblir when the request has no session", () => {
    expect(resolveDocumentTheme({ hasSession: false, stored: "DARK" })).toBe(
      "neblir"
    );
    expect(resolveDocumentTheme({ hasSession: false })).toBe("neblir");
  });

  it("uses the signed-in user's stored theme", () => {
    expect(resolveDocumentTheme({ hasSession: true, stored: "LIGHT" })).toBe(
      "light"
    );
    expect(resolveDocumentTheme({ hasSession: true, stored: null })).toBe(
      "neblir"
    );
  });
});

describe("themeTokens", () => {
  it("keeps Neblir on the pink gradient, purple modal shell, and brand-purple toolbar", () => {
    const neblir = themeTokens("neblir");
    expect(neblir.page).toBe(NEBLIR_PAGE_GRADIENT);
    expect(neblir.modal).toBe(NEBLIR_MODAL_SHELL);
    expect(neblir.toolbar).toBe(DEEP_BRAND_PURPLE);
  });

  it("paints text on the accent with the shared on-accent color", () => {
    for (const theme of ["neblir", "dark", "light"] as const) {
      const style = themeDocumentStyle(theme) as Record<string, string>;
      expect(style["--theme-on-accent-rgb"]).toBe("248 236 255");
    }
  });

  it("keeps Neblir white and modal ink, and reuses Dark and Light text for both", () => {
    const neblir = themeDocumentStyle("neblir") as Record<string, string>;
    expect(neblir["--theme-page"]).toBe(NEBLIR_PAGE_GRADIENT);
    expect(neblir["--theme-white-rgb"]).toBe("255 255 255");
    expect(neblir["--theme-modal-ink-rgb"]).toBe("74 61 94");

    for (const theme of ["dark", "light"] as const) {
      const style = themeDocumentStyle(theme) as Record<string, string>;
      expect(style["--theme-white-rgb"]).toBe(style["--theme-text-rgb"]);
      expect(style["--theme-modal-ink-rgb"]).toBe(style["--theme-text-rgb"]);
    }
  });

  it("gives Dark and Light opaque steps that are not the gradient or the purple shell", () => {
    for (const theme of ["dark", "light"] as const) {
      const tokens = themeTokens(theme);
      expectOpaqueStep(tokens.page);
      expectOpaqueStep(tokens.card);
      expectOpaqueStep(tokens.modal);
      expect(new Set([tokens.page, tokens.card, tokens.modal]).size).toBe(3);
      expect(tokens.page).not.toBe(NEBLIR_PAGE_GRADIENT);
      expect(tokens.accent).toBe(DEEP_BRAND_PURPLE);
      expect(tokens.accent).not.toBe(NEBLIR_MODAL_SHELL);
      expect(tokens.accent).not.toBe("#8b5cf6");
    }

    const dark = themeTokens("dark");
    const light = themeTokens("light");
    expect(dark.page).not.toBe(light.page);
    expect(dark.card).not.toBe(light.card);
    expect(dark.modal).not.toBe(light.modal);
    expect(dark.toolbar).toBe(dark.page);
    expect(light.toolbar).toBe(light.page);
  });

  it("defines distinct safe, warning, and danger on every theme", () => {
    for (const theme of ["neblir", "dark", "light"] as const) {
      const tokens = themeTokens(theme);
      expect(tokens.safe).toMatch(/^#[0-9a-f]{6}$/i);
      expect(tokens.warning).toMatch(/^#[0-9a-f]{6}$/i);
      expect(tokens.danger).toMatch(/^#[0-9a-f]{6}$/i);
      expect(new Set([tokens.safe, tokens.warning, tokens.danger]).size).toBe(
        3
      );
    }
  });
});
