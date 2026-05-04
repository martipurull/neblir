import StarterKit from "@tiptap/starter-kit";

/** Same surface as character notes; enough for headings, lists, bold, italic, etc. */
export const GENERAL_INFORMATION_RICH_TEXT_EXTENSIONS = [StarterKit];

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
