const ANCHOR_TAG_RE = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
const HREF_DOUBLE_QUOTE_RE = /\bhref\s*=\s*"([^"]*)"/i;
const HREF_SINGLE_QUOTE_RE = /\bhref\s*=\s*'([^']*)'/i;
const HREF_UNQUOTED_RE = /\bhref\s*=\s*([^\s>]+)/i;

function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeHrefEntities(raw: string): string {
  return raw
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/gi, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

function extractAnchorHref(attrs: string): string | null {
  const quoted =
    HREF_DOUBLE_QUOTE_RE.exec(attrs) ??
    HREF_SINGLE_QUOTE_RE.exec(attrs) ??
    HREF_UNQUOTED_RE.exec(attrs);
  return quoted?.[1] ?? null;
}

/** True when `href` is an `http:` or `https:` URL. */
export function isAllowedHttpHref(href: string | undefined): boolean {
  if (!href) return false;
  try {
    const url = new URL(href.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Unwrap non-http(s) anchors; http(s) links open in a new tab. */
export function sanitizeRichTextHtmlAnchors(html: string): string {
  return html.replace(ANCHOR_TAG_RE, (_full, attrs: string, inner: string) => {
    const rawHref = extractAnchorHref(attrs);
    if (!rawHref) return inner;
    const href = decodeHrefEntities(rawHref);
    if (!isAllowedHttpHref(href)) return inner;
    return `<a href="${escapeHtmlAttr(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
  });
}
