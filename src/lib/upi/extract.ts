import type { CategoryId } from "@/lib/categories";
import { maskLongNumbers } from "@/lib/privacy";
import { matchKnownMerchant } from "./merchants";

export type Channel = "UPI" | "CARD" | "ATM" | "NEFT" | "IMPS" | "OTHER";

export interface MerchantInfo {
  /** Human name to show ("Swiggy", "Rahul Kumar"). */
  merchant: string;
  /** Stable lower-case id that rules match on ("swiggy", "rahul@okaxis"). */
  merchantKey: string;
  vpa: string | null;
  /** 12-digit UPI/RRN reference. Used for dedup only, never stored. */
  ref: string | null;
  channel: Channel;
  /** Category from the built-in dictionary or the person-to-person heuristic, if any. */
  builtinCategory: CategoryId | null;
}

// Local part without hyphens: "UPI-SWIGGY-swiggy@ybl" must yield "swiggy@ybl", not the whole run.
const VPA_RE = /[a-z0-9][a-z0-9._]{1,63}@[a-z][a-z]{1,30}/i;
const REF_RE = /(?<!\d)\d{12}(?!\d)/;
const IFSC_LIKE = /^[A-Z]{4}0[A-Z0-9]{3,}/;
const BANK_CODES = new Set([
  "SBIN", "HDFC", "ICIC", "UTIB", "KKBK", "YESB", "PYTM", "IDIB", "BARB", "PUNB", "CNRB", "UBIN", "IOBA", "IDFB",
  "INDB", "FDRL", "AIRP", "JIOP", "ESFB", "AUBL", "BKID", "MAHB", "CBIN", "UCBA", "RATN", "KARB", "SIBL", "CIUB",
]);
const NOISE = new Set([
  "UPI", "DR", "CR", "P2M", "P2A", "PAYMENT", "PAY", "PAID", "TO", "BY", "FROM", "TRANSFER", "TRF", "NA", "NULL",
  "SENT", "USING", "VIA", "COLLECT", "REQUEST", "UPIINTENT", "UPI INTENT", "NO REMARKS", "TO TRANSFER",
  "BY TRANSFER", "PAYMENT FROM PH", "PAYMENT FROM PHONEPE", "SENT FROM PAYTM", "PAY TO", "DEMO", "MOB", "IMPS",
  "NEFT", "RTGS", "POS", "ECOM", "PURCHASE", "TXN", "REF", "INB", "MB", "ONLINE", "OK", "UPI LITE", "PAYTM",
]);
const COMPANY_SUFFIX = /\b(pvt|private|ltd|limited|llp|india|technologies|tech|services|retail|internet|co)\b\.?/g;

export interface ExtractOptions {
  /** ICICI puts the sender's free-text remark before the VPA, so the VPA is the better source of the name. */
  preferVpaName?: boolean;
}

export function extractMerchant(rawDescription: string, options: ExtractOptions = {}): MerchantInfo {
  const description = rawDescription.trim();
  const upper = description.toUpperCase();
  const channel = detectChannel(upper);
  const vpa = VPA_RE.exec(description)?.[0].toLowerCase() ?? null;
  const ref = REF_RE.exec(description)?.[0] ?? null;

  if (channel === "ATM") {
    return { merchant: "ATM cash withdrawal", merchantKey: "atm", vpa: null, ref, channel, builtinCategory: "OTHER" };
  }

  const payee = findPayeeName(description, vpa, options.preferVpaName ?? false);
  const haystack = [payee, vpa].filter(Boolean).join(" ");
  const known = haystack ? matchKnownMerchant(haystack) : null;

  if (known?.name) {
    return finish({ merchant: known.name, merchantKey: keyOf(known.name), vpa, ref, channel, builtinCategory: known.category });
  }

  const merchant = payee ? titleCase(payee) : vpa ?? fallbackName(description);
  const merchantKey = vpa ?? (keyOf(payee ?? "") || keyOf(fallbackName(description)) || "unknown");
  const builtinCategory = known?.category ?? (isPersonToPerson(upper, vpa, payee) ? "TRANSFERS" : null);
  return finish({ merchant, merchantKey, vpa, ref, channel, builtinCategory });
}

/** Phone-number VPAs and long digit runs are masked before anything leaves this function. */
function finish(info: MerchantInfo): MerchantInfo {
  return {
    ...info,
    merchant: maskLongNumbers(info.merchant, 10),
    merchantKey: maskLongNumbers(info.merchantKey, 10),
    vpa: info.vpa ? maskLongNumbers(info.vpa, 10) : null,
  };
}

function detectChannel(upper: string): Channel {
  if (/\bUPI\b|UPI\//.test(upper) || /^UPI[-/]/.test(upper)) return "UPI";
  if (/\bATM\b|\bATW\b|CASH ?WDL|CASH WITHDRAWAL|\bNWD\b|\bEAW\b/.test(upper)) return "ATM";
  if (/\bNEFT\b/.test(upper)) return "NEFT";
  if (/\bIMPS\b|\bMMT\b/.test(upper)) return "IMPS";
  if (/\bPOS\b|\bPCD\b|\bECOM\b|DEBIT CARD|\bVPS\b|\bIPS\b/.test(upper)) return "CARD";
  return "OTHER";
}

/**
 * First meaningful name-like field after stripping UPI plumbing (refs, IFSC, bank codes, filler words).
 * Bank layouts differ (SBI: UPI/DR/ref/NAME/..., HDFC: UPI-NAME-vpa-..., Axis: UPI/P2M/ref/NAME/...), but in all of
 * them the payee is the first field that isn't plumbing.
 */
function findPayeeName(description: string, vpa: string | null, preferVpaName: boolean): string | null {
  const fromVpa = vpa ? nameFromVpa(vpa) : null;
  if (preferVpaName && fromVpa) return fromVpa;
  const withoutVpa = vpa ? description.replace(new RegExp(escapeRegExp(vpa), "i"), " ") : description;
  for (const token of withoutVpa.split(/[/|:\\]+|-(?=\S)|\s-\s/)) {
    const cleaned = cleanToken(token);
    if (cleaned && !isNoise(cleaned)) return cleaned;
  }
  return fromVpa;
}

/** Drops number-ish words (refs, masked cards) and leading filler ("POS", "TO") from one field. */
function cleanToken(token: string): string {
  const words = token
    .replace(/[^A-Za-z0-9&'. ]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !/\d{3,}|X{3,}/i.test(w));
  while (words.length && NOISE.has(words[0]!.toUpperCase())) words.shift();
  return words.join(" ").trim();
}

function nameFromVpa(vpa: string): string | null {
  const local = vpa.split("@")[0]!.replace(/[._]/g, " ").replace(/\d+/g, " ").replace(/\s+/g, " ").trim();
  return local.replace(/\s/g, "").length >= 3 ? local : null;
}

function isNoise(token: string): boolean {
  const upper = token.toUpperCase();
  if (upper.replace(/[^A-Z]/g, "").length < 2) return true;
  if (NOISE.has(upper) || BANK_CODES.has(upper) || IFSC_LIKE.test(upper)) return true;
  return /\bBANK\b/.test(upper);
}

/**
 * Personal UPI handles (Google Pay's @ok* handles, phone-number VPAs) and explicit P2A markers mean money went
 * to a person. Heuristic: a small shop on a personal handle will be called a transfer until the user corrects it.
 */
function isPersonToPerson(upper: string, vpa: string | null, payee: string | null): boolean {
  if (/\bP2A\b/.test(upper)) return true;
  if (!vpa) return false;
  const [local = "", handle = ""] = vpa.split("@");
  if (/^\d{10}$/.test(local)) return true;
  const looksLikeName = payee ? /^[a-z]+( [a-z]+){0,3}$/i.test(payee) : false;
  return handle.startsWith("ok") && looksLikeName;
}

function fallbackName(description: string): string {
  const words = description
    .replace(/\b[X*]*\d{4,}\b/g, " ")
    .replace(/[^A-Za-z&' ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !NOISE.has(w.toUpperCase()));
  return words.length ? titleCase(words.slice(0, 3).join(" ")) : "Unknown";
}

export function keyOf(name: string): string {
  return name.toLowerCase().replace(COMPANY_SUFFIX, " ").replace(/[^a-z0-9@.]+/g, " ").trim().replace(/\s+/g, " ");
}

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
