import mammoth from "mammoth";
import { generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

export async function parseDocxToTipTap(file: File): Promise<any> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await mammoth.convertToHtml({ buffer });
  const rawHtml = result.value || "<p></p>";

  try {
    const json = generateJSON(rawHtml, [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
    ]);

    return json;
  } catch (error) {
    console.error("HTML to TipTap conversion error:", error);
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: result.value ? result.value.replace(/<[^>]*>?/gm, "") : "Imported document" }],
        },
      ],
    };
  }
}
