import { describe, expect, it } from "vitest";
import {
  normalizeStoredHtmlForEditor,
  storedRichTextToDisplayHtml,
} from "@/app/lib/tiptap/richText";
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
});

describe("normalizeStoredHtmlForEditor", () => {
  it("decodes entity-encoded HTML for the editor", () => {
    const encoded = "&lt;p&gt;Loaded in editor&lt;/p&gt;";
    expect(normalizeStoredHtmlForEditor(encoded)).toBe(
      "<p>Loaded in editor</p>"
    );
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
