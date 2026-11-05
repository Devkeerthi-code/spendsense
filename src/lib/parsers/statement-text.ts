import { parseStatementDate } from "@/lib/dates";
import { parseAmountToPaise } from "@/lib/money";
import { findAccountLast4 } from "./account";
import type { BankId, Direction, ParseOutcome, ParsedTxn, RowError } from "./types";

/**
 * Parses the text lines of a PDF statement. PDFs have no columns, only positioned text, so a transaction is
 * recognised as a line that starts with a date and ends with money amounts. Narration that wraps onto following
 * lines is joined back. When only "amount balance" is printed (the empty debit or credit column vanishes in
 * extraction), the direction comes from how the running balance moved.
 */

const DATE_AT_START =
  /^(?:\d{1,4}\s+)?(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{1,2}[\s\-][A-Za-z]{3,4}[\s\-,]*\d{2,4}|\d{4}-\d{2}-\d{2})\s+/;
const SECOND_DATE = /^(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{1,2}[\s\-][A-Za-z]{3,4}[\s\-,]*\d{2,4})\s+/;
const MONEY_TOKEN = /^\(?-?[\d,]*\d\.\d{2}\)?(?:\s?\(?(?:cr|dr)\)?\.?)?$/i;
const NOISE_LINE =
  /^(page\s*\d+|\d+\s*of\s*\d+$|(s\.?\s?no\.?\s+)?(txn\s+|tran\s+|transaction\s+|value\s+)?date\b.*\b(narration|description|particulars|remarks|details)\b|statement of account|account statement|opening balance|closing balance|total|grand total|\*\*|this is (a )?(computer|system) generated|end of statement)/i;
const CREDIT_HINT = /\bupi\/cr\b|\/cr\/|\bcr\b|\bcredit(ed)?\b|\bdeposit\b|\breceived\b|\brefund\b|\breversal\b|\bsalary\b|\bneft cr\b|\binterest\b/i;

const BANK_PATTERNS: [BankId, RegExp][] = [
  ["SBI", /state bank of india/i],
  ["HDFC", /hdfc bank/i],
  ["ICICI", /icici bank/i],
  ["AXIS", /axis bank/i],
  ["KOTAK", /kotak mahindra|kotak bank/i],
];

export function detectBankFromText(headerText: string): BankId {
  return BANK_PATTERNS.find(([, re]) => re.test(headerText))?.[0] ?? "GENERIC";
}

interface PendingTxn {
  line: number;
  date: string;
  text: string[];
  amounts: AmountToken[] | null;
}

interface AmountToken {
  paise: number;
  marker: "CR" | "DR" | null;
}

export function parseStatementText(lines: string[]): ParseOutcome {
  const cleanLines = lines.map((l) => l.replace(/\s+/g, " ").trim());
  const firstTxnIndex = cleanLines.findIndex((l) => DATE_AT_START.test(l) && splitTrailingAmounts(l).amounts.length);
  const header = cleanLines.slice(0, firstTxnIndex < 0 ? 30 : firstTxnIndex).join("\n");
  const bank = detectBankFromText(header || cleanLines.slice(0, 30).join("\n"));

  const rows: ParsedTxn[] = [];
  const errors: RowError[] = [];
  let previousBalance = findOpeningBalance(cleanLines);
  let pending: PendingTxn | null = null;

  const flush = () => {
    if (!pending) return;
    const result = finalise(pending, previousBalance);
    if ("error" in result) errors.push({ row: pending.line, message: result.error });
    else {
      rows.push(result.txn);
      if (result.txn.balancePaise != null) previousBalance = result.txn.balancePaise;
    }
    pending = null;
  };

  cleanLines.forEach((line, index) => {
    if (!line) return;
    if (NOISE_LINE.test(line)) {
      flush();
      return;
    }
    const start = DATE_AT_START.exec(line);
    const date = start ? parseStatementDate(start[1]!) : null;
    if (start && date) {
      flush();
      const rest = line.slice(start[0].length).replace(SECOND_DATE, "");
      const { text, amounts } = splitTrailingAmounts(rest);
      pending = { line: index + 1, date, text: text ? [text] : [], amounts: amounts.length ? amounts : null };
      return;
    }
    if (!pending) return;
    const current: PendingTxn = pending;
    if (!current.amounts) {
      const { text, amounts } = splitTrailingAmounts(line);
      if (amounts.length) {
        if (text) current.text.push(text);
        current.amounts = amounts;
        return;
      }
    }
    current.text.push(line);
  });
  flush();

  return { bank, rows, errors, last4: findAccountLast4(header) };
}

/** Peels money tokens ("1,234.00", "250.00 Cr", "-") off the end of a line, keeping at most three. */
export function splitTrailingAmounts(line: string): { text: string; amounts: AmountToken[] } {
  const tokens = line.split(" ").filter(Boolean);
  // Axis prints a branch (SOL) code after the balance; it is never money.
  if (tokens.length > 2 && /^\d{1,5}$/.test(tokens[tokens.length - 1]!) && /\.\d{2}|^\(?(cr|dr)\)?$/i.test(tokens[tokens.length - 2]!)) {
    tokens.pop();
  }
  const amounts: AmountToken[] = [];
  while (tokens.length && amounts.length < 3) {
    let token = tokens[tokens.length - 1]!;
    let marker: AmountToken["marker"] = null;
    if (/^\(?(cr|dr)\)?\.?$/i.test(token) && tokens.length > 1) {
      marker = token.toUpperCase().includes("CR") ? "CR" : "DR";
      token = tokens[tokens.length - 2]!;
      if (!MONEY_TOKEN.test(token)) break;
      tokens.pop();
    } else if (token === "-" && amounts.length < 2) {
      tokens.pop();
      amounts.unshift({ paise: 0, marker: null });
      continue;
    } else if (!MONEY_TOKEN.test(token)) break;
    tokens.pop();
    const inline = /(cr|dr)\)?\.?$/i.exec(token);
    if (inline) marker = inline[1]!.toUpperCase() as "CR" | "DR";
    const paise = parseAmountToPaise(token.replace(/\(?(cr|dr)\)?\.?$/i, ""));
    if (paise == null) break;
    amounts.unshift({ paise: Math.abs(paise), marker });
  }
  return { text: tokens.join(" "), amounts: amounts.some((a) => a.paise > 0) ? amounts : [] };
}

function finalise(p: PendingTxn, previousBalance: number | null): { txn: ParsedTxn } | { error: string } {
  if (!p.amounts) return { error: "couldn't find an amount on this line" };
  const description = p.text.join(" ").trim() || "(no description)";
  const resolved = resolveAmounts(p.amounts, previousBalance, description);
  if (!resolved) return { error: "couldn't tell the amount from the balance" };
  return { txn: { date: p.date, description, ...resolved } };
}

function resolveAmounts(
  amounts: AmountToken[],
  previousBalance: number | null,
  description: string,
): { amountPaise: number; direction: Direction; balancePaise: number | null } | null {
  if (amounts.length === 3) {
    const [debit, credit, balance] = amounts as [AmountToken, AmountToken, AmountToken];
    if (debit.paise > 0 && credit.paise === 0) return { amountPaise: debit.paise, direction: "DEBIT", balancePaise: balance.paise };
    if (credit.paise > 0 && debit.paise === 0) return { amountPaise: credit.paise, direction: "CREDIT", balancePaise: balance.paise };
    // Three non-zero numbers: the first is a stray number from the narration (e.g. a cheque no. printed as 0.00).
    return resolveAmounts([credit, balance], previousBalance, description);
  }
  const [amount, balance] = amounts as [AmountToken, AmountToken | undefined];
  if (amount.paise <= 0) return null;
  const balancePaise = balance ? signedBalance(balance) : null;
  return { amountPaise: amount.paise, direction: directionOf(amount, balancePaise, previousBalance, description), balancePaise };
}

function signedBalance(token: AmountToken): number {
  return token.marker === "DR" ? -token.paise : token.paise;
}

function directionOf(amount: AmountToken, balance: number | null, previous: number | null, description: string): Direction {
  if (amount.marker) return amount.marker === "CR" ? "CREDIT" : "DEBIT";
  if (balance != null && previous != null) {
    if (Math.abs(previous - amount.paise - balance) <= 1) return "DEBIT";
    if (Math.abs(previous + amount.paise - balance) <= 1) return "CREDIT";
  }
  return CREDIT_HINT.test(description) ? "CREDIT" : "DEBIT";
}

function findOpeningBalance(lines: string[]): number | null {
  for (const line of lines.slice(0, 80)) {
    const m = /opening balance\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+\.\d{2})/i.exec(line);
    if (m) return parseAmountToPaise(m[1]);
  }
  return null;
}
