export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function extractTextSnippet(content: any): string {
  if (!content) return "Empty document";

  try {
    const textPieces: string[] = [];

    const traverse = (node: any) => {
      if (node.type === "text" && node.text) {
        textPieces.push(node.text);
      }
      if (Array.isArray(node.content)) {
        for (const child of node.content) {
          traverse(child);
          if (textPieces.join(" ").length > 120) break;
        }
      }
    };

    traverse(content);
    const snippet = textPieces.join(" ").trim();
    return snippet.length > 0 ? (snippet.length > 120 ? snippet.slice(0, 120) + "..." : snippet) : "No text preview";
  } catch (e) {
    return "No text preview";
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
