import { describe, it, expect } from "vitest";
import { parseTxtToTipTap } from "@/lib/parsers/txt-parser";
import { parseMdToTipTap } from "@/lib/parsers/md-parser";

describe("File Import Parsers", () => {
  describe("Plain Text Parser (parseTxtToTipTap)", () => {
    it("converts multi-line text into paragraph nodes", async () => {
      const mockFile = new File(["Line 1\nLine 2\nLine 3"], "test.txt", { type: "text/plain" });
      const result = await parseTxtToTipTap(mockFile);

      expect(result.type).toBe("doc");
      expect(result.content).toHaveLength(3);
      expect(result.content[0]).toEqual({
        type: "paragraph",
        content: [{ type: "text", text: "Line 1" }],
      });
      expect(result.content[2]).toEqual({
        type: "paragraph",
        content: [{ type: "text", text: "Line 3" }],
      });
    });

    it("filters out empty whitespace lines gracefully", async () => {
      const mockFile = new File(["Line 1\n\n\nLine 2\n   "], "test.txt", { type: "text/plain" });
      const result = await parseTxtToTipTap(mockFile);

      expect(result.content).toHaveLength(2);
      expect(result.content[0].content[0].text).toBe("Line 1");
      expect(result.content[1].content[0].text).toBe("Line 2");
    });
  });

  describe("Markdown Parser (parseMdToTipTap)", () => {
    it("converts headings with correct level attributes", async () => {
      const mdContent = "# Main Title\n## Secondary Section\n### Sub-heading";
      const mockFile = new File([mdContent], "doc.md", { type: "text/markdown" });
      const result = await parseMdToTipTap(mockFile);

      expect(result.type).toBe("doc");
      expect(result.content).toHaveLength(3);
      expect(result.content[0].type).toBe("heading");
      expect(result.content[0].attrs.level).toBe(1);
      expect(result.content[1].attrs.level).toBe(2);
      expect(result.content[2].attrs.level).toBe(3);
    });

    it("parses bullet lists and ordered lists correctly", async () => {
      const mdContent = "- First bullet\n- Second bullet\n1. Numbered one\n2. Numbered two";
      const mockFile = new File([mdContent], "lists.md", { type: "text/markdown" });
      const result = await parseMdToTipTap(mockFile);

      expect(result.content[0].type).toBe("bulletList");
      expect(result.content[0].content).toHaveLength(2);
      expect(result.content[1].type).toBe("orderedList");
      expect(result.content[1].content).toHaveLength(2);
    });

    it("preserves bold, italic, and inline code marks", async () => {
      const mdContent = "This is **bold text** and *italic text* and `inline code`.";
      const mockFile = new File([mdContent], "marks.md", { type: "text/markdown" });
      const result = await parseMdToTipTap(mockFile);

      expect(result.content[0].type).toBe("paragraph");
      const textNodes = result.content[0].content;

      const boldNode = textNodes.find((n: any) => n.marks?.some((m: any) => m.type === "bold"));
      expect(boldNode).toBeDefined();
      expect(boldNode.text).toBe("bold text");

      const italicNode = textNodes.find((n: any) => n.marks?.some((m: any) => m.type === "italic"));
      expect(italicNode).toBeDefined();
      expect(italicNode.text).toBe("italic text");

      const codeNode = textNodes.find((n: any) => n.marks?.some((m: any) => m.type === "code"));
      expect(codeNode).toBeDefined();
      expect(codeNode.text).toBe("inline code");
    });

    it("converts blockquotes into ProseMirror blockquote nodes", async () => {
      const mdContent = "> This is a notable quote block";
      const mockFile = new File([mdContent], "quote.md", { type: "text/markdown" });
      const result = await parseMdToTipTap(mockFile);

      expect(result.content[0].type).toBe("blockquote");
      expect(result.content[0].content[0].type).toBe("paragraph");
    });
  });
});
