import { parseBankCsv, parseRowsWithMapping, readCsvTable, suggestMapping } from "./csv";
import { extractPdfLines } from "./pdf";
import { parseStatementText } from "./statement-text";
import type { BankId, ColumnMapping, ParseOutcome } from "./types";

export type FileKind = "csv" | "pdf";

/** Sniffs the real file type from its bytes, not its name: "%PDF" magic, else text that looks like CSV. */
export function detectFileKind(bytes: Uint8Array): FileKind | null {
  const head = new TextDecoder("latin1").decode(bytes.slice(0, 5));
  if (head.startsWith("%PDF")) return "pdf";
  const sample = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 4096));
  // eslint-disable-next-line no-control-regex
  const binary = /[\u0000-\u0008\u000E-\u001F]/.test(sample);
  return !binary && /[,;\t]/.test(sample) ? "csv" : null;
}

export type StatementParse =
  | { kind: "parsed"; outcome: ParseOutcome; fileKind: FileKind }
  | { kind: "needs-mapping"; headers: string[]; sample: string[][]; headerIndex: number; suggestion: Partial<ColumnMapping> };

export interface ParseOptions {
  password?: string;
  /** Set once the user has mapped columns for a CSV the app didn't recognise. */
  mapping?: { headerIndex: number; columns: ColumnMapping };
}

export async function parseStatementFile(bytes: Uint8Array, options: ParseOptions = {}): Promise<StatementParse | null> {
  const fileKind = detectFileKind(bytes);
  if (fileKind === "pdf") {
    const lines = await extractPdfLines(bytes, options.password);
    return { kind: "parsed", fileKind, outcome: parseStatementText(lines) };
  }
  if (fileKind !== "csv") return null;

  const text = new TextDecoder("utf-8").decode(bytes);
  if (options.mapping) {
    const table = readCsvTable(text);
    const outcome = parseRowsWithMapping(table, options.mapping.headerIndex, options.mapping.columns, "GENERIC");
    return { kind: "parsed", fileKind, outcome };
  }
  const parsed = parseBankCsv(text);
  if (parsed.detected.mapping) {
    const { bank, rows, errors, last4 } = parsed;
    return { kind: "parsed", fileKind, outcome: { bank, rows, errors, last4 } };
  }
  const headers = parsed.table[parsed.detected.headerIndex] ?? [];
  return {
    kind: "needs-mapping",
    headers,
    headerIndex: parsed.detected.headerIndex,
    sample: parsed.table.slice(parsed.detected.headerIndex + 1, parsed.detected.headerIndex + 6),
    suggestion: suggestMapping(headers),
  };
}

export type { BankId, ColumnMapping, ParseOutcome };
