import StarterKit from "@tiptap/starter-kit";

/** Shared StarterKit stack for app rich text fields (headings, lists, bold, italic, etc.). */
export const RICH_TEXT_EXTENSIONS = [StarterKit];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * DB / form value → HTML TipTap can load. Legacy plain text becomes a single paragraph
 * (newlines preserved with <br>).
 */
export function normalizeStoredHtmlForEditor(
  stored: string | null | undefined
): string {
  const s = stored?.trim() ?? "";
  if (!s) return "<p></p>";
  if (/<[a-z][\s\S]*>/i.test(s)) return s;
  return `<p>${escapeHtml(s).replace(/\n/g, "<br>")}</p>`;
}

/**
 * TipTap document → persisted string (empty / whitespace-only doc → "").
 * Uses DOM textContent so we treat any visually empty HTML as stored empty.
 */
export function serializeEditorToStoredHtml(html: string): string {
  const t = html.trim();
  if (!t) return "";
  if (typeof document === "undefined") return t;
  const el = document.createElement("div");
  el.innerHTML = t;
  const text = (el.textContent ?? "").replace(/\s+/g, "").trim();
  if (!text) return "";
  return t;
}

/** Persist rich text when non-empty; omit field when blank (API optional fields). */
export function optionalStoredRichHtml(html: string): string | undefined {
  const persisted = serializeEditorToStoredHtml(html.trim());
  return persisted || undefined;
}

/** Read path/item rich text in the UI (HTML from TipTap or legacy plain string). */
export function storedRichTextToDisplayHtml(
  stored: string | null | undefined
): string {
  const s = stored?.trim() ?? "";
  if (!s) return "";
  if (/<[a-z][\s\S]*>/i.test(s)) return s;
  return `<p>${escapeHtml(s).replace(/\n/g, "<br>")}</p>`;
}
