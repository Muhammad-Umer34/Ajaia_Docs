// Utilities for exporting TipTap ProseMirror documents to Markdown, Plain Text, and PDF

export function jsonToMarkdown(doc: any): string {
  if (!doc || !doc.content || !Array.isArray(doc.content)) {
    return "";
  }

  const lines: string[] = [];

  for (const node of doc.content) {
    const md = parseNodeToMarkdown(node);
    if (md !== null) {
      lines.push(md);
    }
  }

  return lines.join("\n\n");
}

function parseNodeToMarkdown(node: any): string {
  if (!node) return "";

  switch (node.type) {
    case "heading": {
      const level = node.attrs?.level || 1;
      const prefix = "#".repeat(Math.min(Math.max(level, 1), 6)) + " ";
      return prefix + renderInlineNodes(node.content);
    }

    case "paragraph": {
      return renderInlineNodes(node.content);
    }

    case "bulletList": {
      if (!node.content || !Array.isArray(node.content)) return "";
      return node.content
        .map((item: any) => {
          const itemText = item.content
            ? item.content.map((p: any) => renderInlineNodes(p.content)).join("\n  ")
            : "";
          return `- ${itemText}`;
        })
        .join("\n");
    }

    case "orderedList": {
      if (!node.content || !Array.isArray(node.content)) return "";
      return node.content
        .map((item: any, index: number) => {
          const itemText = item.content
            ? item.content.map((p: any) => renderInlineNodes(p.content)).join("\n   ")
            : "";
          return `${index + 1}. ${itemText}`;
        })
        .join("\n");
    }

    case "blockquote": {
      if (!node.content || !Array.isArray(node.content)) return "";
      const text = node.content.map((p: any) => renderInlineNodes(p.content)).join("\n> ");
      return `> ${text}`;
    }

    case "codeBlock": {
      const lang = node.attrs?.language || "";
      const code = renderInlineNodes(node.content);
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case "horizontalRule": {
      return "---";
    }

    default:
      return renderInlineNodes(node.content);
  }
}

function renderInlineNodes(content: any[]): string {
  if (!content || !Array.isArray(content)) return "";

  return content
    .map((node: any) => {
      if (node.type === "text") {
        let text = node.text || "";
        if (node.marks && Array.isArray(node.marks)) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case "bold":
                text = `**${text}**`;
                break;
              case "italic":
                text = `*${text}*`;
                break;
              case "strike":
                text = `~~${text}~~`;
                break;
              case "code":
                text = `\`${text}\``;
                break;
              case "underline":
                text = `<u>${text}</u>`;
                break;
            }
          }
        }
        return text;
      }

      if (node.type === "hardBreak") {
        return "\n";
      }

      return "";
    })
    .join("");
}

export function jsonToPlainText(doc: any): string {
  if (!doc || !doc.content || !Array.isArray(doc.content)) {
    return "";
  }

  const lines: string[] = [];

  for (const node of doc.content) {
    const text = extractPlainText(node);
    if (text.trim()) {
      lines.push(text);
    }
  }

  return lines.join("\n\n");
}

function extractPlainText(node: any): string {
  if (!node) return "";

  if (node.type === "text") {
    return node.text || "";
  }

  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractPlainText).join("");
  }

  return "";
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  if (typeof window === "undefined") return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportDocumentToMarkdown(title: string, content: any): void {
  const md = jsonToMarkdown(content);
  const filename = `${sanitizeFilename(title)}.md`;
  downloadFile(filename, md, "text/markdown;charset=utf-8");
}

export function exportDocumentToText(title: string, content: any): void {
  const text = jsonToPlainText(content);
  const filename = `${sanitizeFilename(title)}.txt`;
  downloadFile(filename, text, "text/plain;charset=utf-8");
}

export function exportDocumentToPDF(title: string): void {
  if (typeof window === "undefined") return;

  // Set document title temporarily for PDF print file name
  const originalTitle = document.title;
  document.title = title;

  window.print();

  // Restore title after print dialog opens
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_") || "document";
}
