import { describe, expect, it } from "vitest";
import {
  normalizeStoredHtmlForEditor,
  serializeEditorToStoredHtml,
  storedRichTextToDisplayHtml,
} from "@/app/lib/tiptap/richText";
import {
  sanitizeRichTextJsonDoc,
  storedRichTextJsonToHtml,
} from "@/app/lib/tiptap/richTextJsonDoc";
import { richTextToPlainTextPreview } from "@/app/lib/tiptap/richTextPlainTextPreview";

describe("storedRichTextToDisplayHtml", () => {
  it("returns empty for blank input", () => {
    expect(storedRichTextToDisplayHtml(null)).toBe("");
    expect(storedRichTextToDisplayHtml("   ")).toBe("");
  });

  it("wraps legacy plain text in a paragraph", () => {
    expect(storedRichTextToDisplayHtml("Hello world")).toBe(
      "<p>Hello world</p>"
    );
  });

  it("passes through TipTap HTML", () => {
    const html = "<p>The medkit is a basic element.</p>";
    expect(storedRichTextToDisplayHtml(html)).toBe(html);
  });

  it("decodes entity-encoded HTML from legacy imports", () => {
    const encoded = "&lt;p&gt;The medkit is a basic element.&lt;/p&gt;";
    expect(storedRichTextToDisplayHtml(encoded)).toBe(
      "<p>The medkit is a basic element.</p>"
    );
  });

  it("treats orphan closing tags as HTML fragments", () => {
    const fragment = "The medkit is basic.</p>";
    expect(storedRichTextToDisplayHtml(fragment)).toBe(fragment);
  });

  it("does not keep javascript hrefs in displayed HTML", () => {
    const html = storedRichTextToDisplayHtml(
      '<p><a href="javascript:alert(1)">click</a></p>'
    );
    expect(html).not.toMatch(/javascript:/i);
    expect(html).toContain("click");
  });

  it("does not keep mailto or data hrefs in displayed HTML", () => {
    const html = storedRichTextToDisplayHtml(
      '<p><a href="mailto:gm@example.com">mail</a> <a href="data:text/html,hi">data</a></p>'
    );
    expect(html).not.toMatch(/mailto:/i);
    expect(html).not.toMatch(/data:/i);
    expect(html).toContain("mail");
    expect(html).toContain("data");
  });

  it("keeps http and https links and opens them in a new tab", () => {
    const html = storedRichTextToDisplayHtml(
      '<p><a href="https://example.com/doc">Docs</a> <a href="http://example.org">Old</a></p>'
    );
    expect(html).toContain('href="https://example.com/doc"');
    expect(html).toContain('href="http://example.org"');
    expect(html).toContain("Docs");
    expect(html).toContain("Old");
    expect(html).toMatch(/target="_blank"/);
  });

  it("keeps underline markup", () => {
    expect(storedRichTextToDisplayHtml("<p><u>important</u></p>")).toContain(
      "<u>important</u>"
    );
  });
});

describe("normalizeStoredHtmlForEditor", () => {
  it("decodes entity-encoded HTML for the editor", () => {
    const encoded = "&lt;p&gt;Loaded in editor&lt;/p&gt;";
    expect(normalizeStoredHtmlForEditor(encoded)).toBe(
      "<p>Loaded in editor</p>"
    );
  });
});

describe("serializeEditorToStoredHtml", () => {
  it("serializes empty documents as an empty string", () => {
    expect(serializeEditorToStoredHtml("")).toBe("");
    expect(serializeEditorToStoredHtml("   ")).toBe("");
    expect(serializeEditorToStoredHtml("<p></p>")).toBe("");
    expect(serializeEditorToStoredHtml("<p><br></p>")).toBe("");
  });

  it("does not persist javascript hrefs", () => {
    const stored = serializeEditorToStoredHtml(
      '<p><a href="javascript:alert(1)">click</a></p>'
    );
    expect(stored).not.toMatch(/javascript:/i);
    expect(stored).toContain("click");
  });

  it("persists underline and http(s) links that open in a new tab", () => {
    const stored = serializeEditorToStoredHtml(
      '<p><u>note</u> <a href="https://example.com/doc">Docs</a></p>'
    );
    expect(stored).toContain("<u>note</u>");
    expect(stored).toContain('href="https://example.com/doc"');
    expect(stored).toMatch(/target="_blank"/);
  });

  it("does not persist mailto hrefs", () => {
    const stored = serializeEditorToStoredHtml(
      '<p><a href="mailto:gm@example.com">mail</a></p>'
    );
    expect(stored).not.toMatch(/mailto:/i);
    expect(stored).toContain("mail");
  });
});

describe("richTextToPlainTextPreview", () => {
  it("strips tags from entity-encoded HTML", () => {
    expect(
      richTextToPlainTextPreview(
        "&lt;p&gt;The medkit is a basic element.&lt;/p&gt;"
      )
    ).toBe("The medkit is a basic element.");
  });
});

describe("storedRichTextJsonToHtml", () => {
  it("renders https links from stored JSON docs", () => {
    const stored = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Docs",
              marks: [
                { type: "link", attrs: { href: "https://example.com/doc" } },
              ],
            },
          ],
        },
      ],
    });
    const html = storedRichTextJsonToHtml(stored);
    expect(html).toContain("https://example.com/doc");
    expect(html).toContain("Docs");
    expect(html).toMatch(/target="_blank"/);
  });

  it("does not emit javascript hrefs from stored JSON docs", () => {
    const stored = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "click",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    });
    const html = storedRichTextJsonToHtml(stored);
    expect(html).not.toMatch(/javascript:/i);
    expect(html).not.toMatch(/<a\b/i);
    expect(html).toContain("click");
  });

  it("renders underline from stored JSON docs", () => {
    const stored = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "important",
              marks: [{ type: "underline" }],
            },
          ],
        },
      ],
    });
    expect(storedRichTextJsonToHtml(stored)).toContain("<u>important</u>");
  });

  it("strips javascript link marks from JSON docs and keeps https marks", () => {
    const dirty = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "click",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
            { type: "text", text: " " },
            {
              type: "text",
              text: "Docs",
              marks: [
                { type: "link", attrs: { href: "https://example.com/doc" } },
              ],
            },
          ],
        },
      ],
    };
    const clean = sanitizeRichTextJsonDoc(dirty);
    expect(JSON.stringify(clean)).not.toMatch(/javascript:/i);
    const linked = clean.content?.[0]?.content?.find(
      (node) => node.text === "Docs"
    );
    expect(linked?.marks).toEqual([
      { type: "link", attrs: { href: "https://example.com/doc" } },
    ]);
    const clicked = clean.content?.[0]?.content?.find(
      (node) => node.text === "click"
    );
    expect(clicked?.marks).toBeUndefined();
  });
});
