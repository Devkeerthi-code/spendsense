const NUMBER = /^-?\d+(\.\d+)?$/;

/**
 * Quotes a CSV cell, and prefixes text that starts with = + - @ with an apostrophe so the export can't run
 * formulas when opened in Excel (CSV injection). Plain numbers like "-299.00" are left alone.
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) && !NUMBER.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
