import { describe, it, expect } from "vitest";
import { jsonToMarkdown, jsonToPlainText } from "@/lib/export";

describe("Export Utilities", () => {
  it("converts headings to markdown", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Main Title" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Subtitle" }],
        },
      ],
    };

    const md = jsonToMarkdown(doc);
    expect(md).toContain("# Main Title");
    expect(md).toContain("## Subtitle");
  });

  it("converts formatted text marks (bold, italic, code) to markdown", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello " },
            { type: "text", text: "world", marks: [{ type: "bold" }] },
            { type: "text", text: " with " },
            { type: "text", text: "code", marks: [{ type: "code" }] },
          ],
        },
      ],
    };

    const md = jsonToMarkdown(doc);
    expect(md).toBe("Hello **world** with `code`");
  });

  it("converts lists to markdown", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "First" }] }],
            },
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Second" }] }],
            },
          ],
        },
      ],
    };

    const md = jsonToMarkdown(doc);
    expect(md).toContain("- First");
    expect(md).toContain("- Second");
  });

  it("extracts clean plain text", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Header" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Some " },
            { type: "text", text: "bold text", marks: [{ type: "bold" }] },
          ],
        },
      ],
    };

    const text = jsonToPlainText(doc);
    expect(text).toContain("Header");
    expect(text).toContain("Some bold text");
    expect(text).not.toContain("**");
    expect(text).not.toContain("#");
  });
});
