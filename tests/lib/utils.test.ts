import { describe, it, expect, vi } from "vitest";
import { formatDate, getInitials, extractTextSnippet, debounce } from "@/lib/utils";

describe("Utility Functions", () => {
  describe("getInitials", () => {
    it("extracts first and last initials from full names", () => {
      expect(getInitials("Alice Johnson")).toBe("AJ");
      expect(getInitials("Bob Smith")).toBe("BS");
      expect(getInitials("Charlie")).toBe("CH");
      expect(getInitials("")).toBe("?");
    });
  });

  describe("formatDate", () => {
    it("returns 'Just now' for timestamps in the last minute", () => {
      const now = new Date().toISOString();
      expect(formatDate(now)).toBe("Just now");
    });

    it("returns relative minutes for recent edits", () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatDate(fiveMinsAgo)).toBe("5m ago");
    });

    it("returns relative hours for edits today", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatDate(twoHoursAgo)).toBe("2h ago");
    });
  });

  describe("extractTextSnippet", () => {
    it("extracts text from nested TipTap AST JSON structures", () => {
      const ast = {
        type: "doc",
        content: [
          {
            type: "heading",
            content: [{ type: "text", text: "Meeting Agenda" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Discussing Q3 project deliverables and roadmap." }],
          },
        ],
      };

      const snippet = extractTextSnippet(ast);
      expect(snippet).toContain("Meeting Agenda");
      expect(snippet).toContain("Discussing Q3 project deliverables");
    });

    it("handles empty or malformed input gracefully", () => {
      expect(extractTextSnippet(null)).toBe("Empty document");
      expect(extractTextSnippet({})).toBe("No text preview");
    });
  });

  describe("debounce", () => {
    it("debounces rapid successive calls and fires once after the delay", async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 200);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(250);
      expect(fn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });
});
