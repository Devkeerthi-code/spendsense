import { extractTextItems, getDocumentProxy } from "unpdf";

export class PdfPasswordError extends Error {
  constructor(public readonly wrongPassword: boolean) {
    super(wrongPassword ? "That password didn't open the PDF." : "This PDF is password protected.");
  }
}

interface Positioned {
  str: string;
  x: number;
  y: number;
  fontSize: number;
}

/**
 * Rebuilds visual lines from a PDF: text items that share a baseline (within half a font size) become one line,
 * left to right. Runs entirely in memory; the file is never written anywhere.
 */
export async function extractPdfLines(data: Uint8Array, password?: string): Promise<string[]> {
  let doc;
  try {
    doc = await getDocumentProxy(data, password ? { password } : {});
  } catch (err) {
    if (err instanceof Error && err.name === "PasswordException") throw new PdfPasswordError(Boolean(password));
    throw err;
  }
  try {
    const { items } = await extractTextItems(doc);
    return items.flatMap((page) => groupIntoLines(page.filter((i) => i.str.trim() !== "")));
  } finally {
    await doc.loadingTask.destroy();
  }
}

export function groupIntoLines(items: Positioned[]): string[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: Positioned[][] = [];
  for (const item of sorted) {
    const current = lines[lines.length - 1];
    const tolerance = Math.max(2, (item.fontSize || 10) * 0.5);
    if (current && Math.abs(current[0]!.y - item.y) <= tolerance) current.push(item);
    else lines.push([item]);
  }
  return lines.map((line) =>
    line
      .sort((a, b) => a.x - b.x)
      .map((i) => i.str.trim())
      .join(" "),
  );
}
