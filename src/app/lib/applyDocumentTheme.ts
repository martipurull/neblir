import { themeDocumentStyle, themeTokens, type Theme } from "@/app/lib/theme";

/** Switches the open document to a Theme after that Theme has been saved. */
export function applyDocumentTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  const style = themeDocumentStyle(theme);
  for (const [key, value] of Object.entries(style)) {
    if (typeof value === "string") {
      root.style.setProperty(key, value);
    }
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", themeTokens(theme).toolbar);
  }
}
