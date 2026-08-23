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

export async function parseTxtToTipTap(file: File): Promise<any> {
  const text = await getFileString(file);
  const lines = text.split(/\r?\n/);

  const content = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => ({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: line,
        },
      ],
    }));

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}
