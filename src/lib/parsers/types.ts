export type BankId = "SBI" | "HDFC" | "ICICI" | "AXIS" | "KOTAK" | "GENERIC";

export const BANK_LABEL: Record<BankId, string> = {
  SBI: "SBI",
  HDFC: "HDFC Bank",
  ICICI: "ICICI Bank",
  AXIS: "Axis Bank",
  KOTAK: "Kotak Mahindra Bank",
  GENERIC: "Other bank",
};

export type Direction = "DEBIT" | "CREDIT";

export interface ParsedTxn {
  /** ISO calendar date, YYYY-MM-DD. */
  date: string;
  /** Raw narration as the bank printed it (masked later, before storage). */
  description: string;
  /** Always positive. */
  amountPaise: number;
  direction: Direction;
  balancePaise: number | null;
}

export interface RowError {
  /** 1-based line or row number in the file, so the message matches what the user sees in Excel. */
  row: number;
  message: string;
}

export interface ParseOutcome {
  bank: BankId;
  rows: ParsedTxn[];
  errors: RowError[];
  /** Last four digits of the account number if the statement shows it, else "". */
  last4: string;
}

/** Column indices for a CSV. Either debit/credit columns, or one amount column (signed, or with a Dr/Cr column). */
export interface ColumnMapping {
  date: number;
  description: number;
  debit?: number | null;
  credit?: number | null;
  amount?: number | null;
  drCr?: number | null;
  balance?: number | null;
}
