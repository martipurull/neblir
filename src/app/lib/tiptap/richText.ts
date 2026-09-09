import { storedRichTextJsonToHtml } from "@/app/lib/tiptap/richTextJsonDoc";
import { sanitizeRichTextHtmlAnchors } from "@/app/lib/tiptap/richTextSanitize";

export { RICH_TEXT_EXTENSIONS } from "@/app/lib/tiptap/richTextExtensions";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Decode common HTML entities once (legacy imports / double-encoded rows). */
function decodeHtmlEntitiesOnce(s: string): string {
  if (!/&(?:lt|gt|amp|quot|#39);/i.test(s)) return s;
  if (typeof document !== "undefined") {
    const el = document.createElement("textarea");
    el.innerHTML = s;
    return el.value;
  }
  return s
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&");
}

/** Opening, void, or closing tags — includes `</p>` and `&lt;p&gt;` before decode. */
function looksLikeStoredRichTextHtml(s: string): boolean {
  if (/<\/?[a-z][^>]*>/i.test(s)) return true;
  if (/&lt;\/?[a-z]/i.test(s)) return true;
  return false;
}

/** Trim and decode entity-encoded HTML so display/editor paths agree. */
function normalizeStoredRichTextContent(
  stored: string | null | undefined
): string {
  const trimmed = stored?.trim() ?? "";
  if (!trimmed) return "";
  if (/&lt;\/?[a-z]/i.test(trimmed)) {
    return decodeHtmlEntitiesOnce(trimmed).trim();
  }
  return trimmed;
}

/**
 * DB / form value → HTML TipTap can load. Legacy plain text becomes a single paragraph
 * (newlines preserved with <br>).
 */
export function normalizeStoredHtmlForEditor(
  stored: string | null | undefined
): string {
  const s = normalizeStoredRichTextContent(stored);
  if (!s) return "<p></p>";
  if (looksLikeStoredRichTextHtml(s)) return sanitizeRichTextHtmlAnchors(s);
  return `<p>${escapeHtml(s).replace(/\n/g, "<br>")}</p>`;
}

function htmlHasVisibleText(html: string): boolean {
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = html;
    return (el.textContent ?? "").replace(/\s+/g, "").trim().length > 0;
  }
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, "").length > 0;
}

/**
 * TipTap document → persisted string (empty / whitespace-only doc → "").
 * Uses DOM textContent so we treat any visually empty HTML as stored empty.
 */
export function serializeEditorToStoredHtml(html: string): string {
  const t = html.trim();
  if (!t) return "";
  const sanitized = sanitizeRichTextHtmlAnchors(t);
  if (!htmlHasVisibleText(sanitized)) return "";
  return sanitized;
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
  const s = normalizeStoredRichTextContent(stored);
  if (!s) return "";
  if (looksLikeStoredRichTextHtml(s)) return sanitizeRichTextHtmlAnchors(s);
  return `<p>${escapeHtml(s).replace(/\n/g, "<br>")}</p>`;
}

function isStoredRichTextJsonDoc(stored: string): boolean {
  try {
    const parsed = JSON.parse(stored) as unknown;
    return (
      !!parsed &&
      typeof parsed === "object" &&
      (parsed as { type?: string }).type === "doc"
    );
  } catch {
    return false;
  }
}

/**
 * Character notes (and similar envelopes): legacy TipTap JSON → HTML for the editor;
 * otherwise same as {@link normalizeStoredHtmlForEditor}.
 */
export function normalizeStoredNoteContentForEditor(
  stored: string | null | undefined
): string {
  const s = stored?.trim() ?? "";
  if (!s) return "<p></p>";
  if (isStoredRichTextJsonDoc(s)) {
    const html = storedRichTextJsonToHtml(s);
    return html || "<p></p>";
  }
  return normalizeStoredHtmlForEditor(s);
}

/** Display path for notes: JSON doc, HTML, or legacy plain text. */
export function storedNoteContentToDisplayHtml(
  stored: string | null | undefined
): string {
  const s = stored?.trim() ?? "";
  if (!s) return "";
  if (isStoredRichTextJsonDoc(s)) {
    return storedRichTextJsonToHtml(s);
  }
  return storedRichTextToDisplayHtml(s);
}
