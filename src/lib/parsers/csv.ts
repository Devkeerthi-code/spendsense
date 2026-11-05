import Papa from "papaparse";
import { parseStatementDate } from "@/lib/dates";
import { parseAmountToPaise } from "@/lib/money";
import { findAccountLast4 } from "./account";
import type { BankId, ColumnMapping, Direction, ParseOutcome, ParsedTxn, RowError } from "./types";

/** Header names reduced to lowercase letters/digits so "Withdrawal Amt." and "withdrawal amt" compare equal. */
export function normaliseHeader(cell: string): string {
  return cell.toLowerCase().replace(/[^a-z0-9]/g, "");
}

interface BankCsvFormat {
  bank: Exclude<BankId, "GENERIC">;
  /** Every one of these normalised headers must be present for the format to match. */
  signature: string[];
  columns: Record<keyof ColumnMapping, string[]>;
}

const NONE: string[] = [];

/** Column layouts of the CSV/Excel exports from net banking, as of 2025-26. */
export const BANK_CSV_FORMATS: BankCsvFormat[] = [
  {
    bank: "HDFC",
    signature: ["narration", "closingbalance"],
    columns: {
      date: ["date"],
      description: ["narration"],
      debit: ["withdrawalamt", "withdrawalamount"],
      credit: ["depositamt", "depositamount"],
      amount: NONE,
      drCr: NONE,
      balance: ["closingbalance"],
    },
  },
  {
    bank: "ICICI",
    signature: ["transactionremarks"],
    columns: {
      date: ["transactiondate", "valuedate"],
      description: ["transactionremarks"],
      debit: ["withdrawalamountinr", "withdrawalamount"],
      credit: ["depositamountinr", "depositamount"],
      amount: NONE,
      drCr: NONE,
      balance: ["balanceinr", "balance"],
    },
  },
  {
    bank: "AXIS",
    signature: ["trandate", "particulars"],
    columns: {
      date: ["trandate"],
      description: ["particulars"],
      debit: ["dr", "debit"],
      credit: ["cr", "credit"],
      amount: NONE,
      drCr: NONE,
      balance: ["bal", "balance"],
    },
  },
  {
    bank: "SBI",
    signature: ["txndate", "description"],
    columns: {
      date: ["txndate"],
      description: ["description"],
      debit: ["debit"],
      credit: ["credit"],
      amount: NONE,
      drCr: NONE,
      balance: ["balance"],
    },
  },
  {
    bank: "KOTAK",
    signature: ["transactiondate", "description", "chqrefno"],
    columns: {
      date: ["transactiondate"],
      description: ["description"],
      debit: ["debit", "withdrawalsdr", "withdrawaldr"],
      credit: ["credit", "depositscr", "depositcr"],
      amount: ["amount"],
      drCr: ["drcr"],
      balance: ["balance"],
    },
  },
];

export function readCsvTable(text: string): string[][] {
  const result = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: "greedy" });
  return result.data.map((row) => row.map((cell) => (cell ?? "").trim()));
}

export interface DetectedCsv {
  bank: BankId;
  headerIndex: number;
  mapping: ColumnMapping | null;
}

/** Banks put a few lines of account details above the table, so search the first rows for a known header. */
export function detectCsvFormat(table: string[][]): DetectedCsv {
  const limit = Math.min(table.length, 40);
  for (let i = 0; i < limit; i++) {
    const headers = table[i]!.map(normaliseHeader);
    for (const format of BANK_CSV_FORMATS) {
      if (!format.signature.every((s) => headers.includes(s))) continue;
      const mapping = mapColumns(headers, format.columns);
      if (mapping) return { bank: format.bank, headerIndex: i, mapping };
    }
  }
  return { bank: "GENERIC", headerIndex: findGenericHeaderRow(table), mapping: null };
}

function mapColumns(headers: string[], columns: BankCsvFormat["columns"]): ColumnMapping | null {
  const find = (aliases: string[]) => {
    for (const alias of aliases) {
      const index = headers.indexOf(alias);
      if (index >= 0) return index;
    }
    return null;
  };
  const date = find(columns.date);
  const description = find(columns.description);
  if (date == null || description == null) return null;
  const mapping: ColumnMapping = {
    date,
    description,
    debit: find(columns.debit),
    credit: find(columns.credit),
    amount: find(columns.amount),
    drCr: find(columns.drCr),
    balance: find(columns.balance),
  };
  return hasAmountColumns(mapping) ? mapping : null;
}

export function hasAmountColumns(m: ColumnMapping): boolean {
  return m.debit != null || m.credit != null || m.amount != null;
}

/** The header is the first row of 3+ cells directly above a row that contains a date. */
function findGenericHeaderRow(table: string[][]): number {
  const limit = Math.min(table.length - 1, 40);
  for (let i = 0; i < limit; i++) {
    const filled = table[i]!.filter(Boolean).length;
    const nextHasDate = table[i + 1]!.some((c) => parseStatementDate(c) !== null);
    if (filled >= 3 && nextHasDate) return i;
  }
  return 0;
}

const GENERIC_ALIASES: Record<keyof ColumnMapping, RegExp> = {
  date: /date/,
  description: /description|narration|particulars|remarks|details|merchant|payee/,
  debit: /debit|withdrawal|^dr$|paidout|moneyout/,
  credit: /credit|deposit|^cr$|paidin|moneyin/,
  amount: /^amount|amountinr$|^amt$/,
  drCr: /^drcr$|^type$|crdr|transactiontype/,
  balance: /balance|^bal$/,
};

/** Best guess for the column-mapping screen. The user confirms or changes it before anything is imported. */
export function suggestMapping(headers: string[]): Partial<ColumnMapping> {
  const normalised = headers.map(normaliseHeader);
  const used = new Set<number>();
  const suggestion: Partial<ColumnMapping> = {};
  for (const key of Object.keys(GENERIC_ALIASES) as (keyof ColumnMapping)[]) {
    const index = normalised.findIndex((h, i) => !used.has(i) && GENERIC_ALIASES[key].test(h));
    if (index >= 0) {
      suggestion[key] = index;
      used.add(index);
    }
  }
  return suggestion;
}

const FOOTER_RE = /opening balance|closing balance|^total|^\*+|generated|brought forward|carried forward/i;
/** Everything after these is a summary block, not transactions. */
const END_OF_TABLE_RE = /statement summary|end of statement/i;

/** Turns table rows into transactions using a column mapping. Shared by the bank formats and the generic importer. */
export function parseRowsWithMapping(table: string[][], headerIndex: number, mapping: ColumnMapping, bank: BankId): ParseOutcome {
  const rows: ParsedTxn[] = [];
  const errors: RowError[] = [];
  const cell = (row: string[], index: number | null | undefined) => (index == null ? "" : (row[index] ?? ""));

  for (let i = headerIndex + 1; i < table.length; i++) {
    const row = table[i]!;
    if (END_OF_TABLE_RE.test(row.join(" "))) break;
    const rawDate = cell(row, mapping.date);
    const description = cell(row, mapping.description).replace(/\s+/g, " ");
    const amount = readAmount(row, mapping);
    const date = rawDate ? parseStatementDate(rawDate) : null;

    if (!rawDate && description && !amount && rows.length) {
      // Narration that wrapped onto its own row.
      rows[rows.length - 1]!.description += ` ${description}`;
      continue;
    }
    if (FOOTER_RE.test(row.join(" ")) && !date) continue;
    if (!amount) {
      if (date && amountCellsPresent(row, mapping)) errors.push({ row: i + 1, message: "couldn't read the amount" });
      continue;
    }
    if (!date) {
      errors.push({ row: i + 1, message: rawDate ? `couldn't read date '${rawDate}'` : "date is missing" });
      continue;
    }
    rows.push({
      date,
      description: description || "(no description)",
      amountPaise: amount.paise,
      direction: amount.direction,
      balancePaise: parseAmountToPaise(cell(row, mapping.balance)),
    });
  }
  return { bank, rows, errors, last4: findAccountLast4(table.slice(0, headerIndex).flat().join(" ")) };
}

function amountCellsPresent(row: string[], m: ColumnMapping): boolean {
  return [m.debit, m.credit, m.amount].some((i) => i != null && (row[i] ?? "").trim() !== "");
}

function readAmount(row: string[], m: ColumnMapping): { paise: number; direction: Direction } | null {
  const debit = m.debit != null ? parseAmountToPaise(row[m.debit]) : null;
  const credit = m.credit != null ? parseAmountToPaise(row[m.credit]) : null;
  if (debit) return { paise: Math.abs(debit), direction: "DEBIT" };
  if (credit) return { paise: Math.abs(credit), direction: "CREDIT" };
  if (m.amount == null) return null;

  const raw = row[m.amount] ?? "";
  const value = parseAmountToPaise(raw);
  if (!value) return null;
  const marker = `${m.drCr != null ? (row[m.drCr] ?? "") : ""} ${raw}`.toUpperCase();
  if (/\b(DR|D|DEBIT|WITHDRAWAL)\b\.?/.test(marker)) return { paise: Math.abs(value), direction: "DEBIT" };
  if (/\b(CR|C|CREDIT|DEPOSIT)\b\.?/.test(marker)) return { paise: Math.abs(value), direction: "CREDIT" };
  return { paise: Math.abs(value), direction: value < 0 ? "DEBIT" : "CREDIT" };
}

export function parseBankCsv(text: string): ParseOutcome & { detected: DetectedCsv; table: string[][] } {
  const table = readCsvTable(text);
  const detected = detectCsvFormat(table);
  if (!detected.mapping) {
    return { bank: "GENERIC", rows: [], errors: [], last4: "", detected, table };
  }
  return { ...parseRowsWithMapping(table, detected.headerIndex, detected.mapping, detected.bank), detected, table };
}
