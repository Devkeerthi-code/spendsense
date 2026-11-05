import type { RowError } from "@/lib/parsers/types";

/** Rows the parser couldn't read, shown as torn lines with the row number as it appears in Excel. */
export function RowErrors({ errors, total }: { errors: RowError[]; total?: number }) {
  if (!errors.length) return null;
  return (
    <details className="rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium text-danger">
        {total ?? errors.length} row{(total ?? errors.length) === 1 ? "" : "s"} couldn&apos;t be read and will be skipped
      </summary>
      <ul className="num mt-2 grid gap-1 text-caption text-ink">
        {errors.map((e) => (
          <li key={`${e.row}-${e.message}`}>
            <span className="text-danger">Row {e.row}:</span> {e.message}
          </li>
        ))}
      </ul>
    </details>
  );
}
