/**
 * Masks every run of `minDigits`+ digits down to its last four ("123456789012" -> "XXXXXXXX9012").
 * Account numbers, phone numbers in VPAs and card numbers all get caught by this.
 */
export function maskLongNumbers(text: string, minDigits = 9): string {
  const re = new RegExp(`[0-9]{${minDigits},}`, "g");
  return text.replace(re, (run) => "X".repeat(run.length - 4) + run.slice(-4));
}

/** Last four digits of an account number, or "" when there aren't enough digits to tell. */
export function last4Of(accountNumber: string | null | undefined): string {
  const digits = (accountNumber ?? "").replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : "";
}

export function maskedAccount(last4: string): string {
  return last4 ? `XXXX${last4}` : "Account number not shown";
}
