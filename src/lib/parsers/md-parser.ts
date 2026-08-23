function parseInlineMarks(text: string): any[] {
  if (!text) return [];

  const nodes: any[] = [];
  // Match bold (**text** or __text__) and italic (*text* or _text_)
  const regex = /(\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_(.+?)_|`(.+?)`|([^*_`]+))/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[2] || match[3]) {
      // Bold
      nodes.push({
        type: "text",
        marks: [{ type: "bold" }],
        text: match[2] || match[3],
      });
    } else if (match[4] || match[5]) {
      // Italic
      nodes.push({
        type: "text",
        marks: [{ type: "italic" }],
        text: match[4] || match[5],
      });
    } else if (match[6]) {
      // Inline code
      nodes.push({
        type: "text",
        marks: [{ type: "code" }],
        text: match[6],
      });
    } else if (match[7]) {
      // Normal text
      nodes.push({
        type: "text",
        text: match[7],
      });
    }
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text }];
}

async function getFileString(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return await file.text();
  }
  if (typeof file.arrayBuffer === "function") {
    const buffer = await file.arrayBuffer();
    return Buffer.from(buffer).toString("utf-8");
  }
  return "";
}

export async function parseMdToTipTap(file: File): Promise<any> {
  const text = await getFileString(file);
  const lines = text.split(/\r?\n/);
  const nodes: any[] = [];

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      i++;
      continue;
    }

    // Heading (# H1, ## H2, ### H3)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      nodes.push({
        type: "heading",
        attrs: { level },
        content: parseInlineMarks(headingMatch[2]),
      });
      i++;
      continue;
    }

    // Blockquote (> Quote)
    if (line.startsWith(">")) {
      const quoteText = line.replace(/^>\s*/, "");
      nodes.push({
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: parseInlineMarks(quoteText),
          },
        ],
      });
      i++;
      continue;
    }

    // Bullet List (- Item or * Item)
    if (/^[-*]\s+/.test(line)) {
      const listItems: any[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[-*]\s+/, "");
        listItems.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: parseInlineMarks(itemText),
            },
          ],
        });
        i++;
      }
      nodes.push({
        type: "bulletList",
        content: listItems,
      });
      continue;
    }

    // Ordered List (1. Item, 2. Item)
    if (/^\d+\.\s+/.test(line)) {
      const listItems: any[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, "");
        listItems.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: parseInlineMarks(itemText),
            },
          ],
        });
        i++;
      }
      nodes.push({
        type: "orderedList",
        content: listItems,
      });
      continue;
    }

    // Standard Paragraph
    nodes.push({
      type: "paragraph",
      content: parseInlineMarks(line),
    });
    i++;
  }

  return {
    type: "doc",
    content: nodes.length > 0 ? nodes : [{ type: "paragraph" }],
  };
}
