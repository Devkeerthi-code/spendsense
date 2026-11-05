"use client";

import { useState, type FormEvent } from "react";
import type { ColumnMapping } from "@/lib/parsers/types";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";
import type { MappingPayload } from "./useImportFlow";
import { OPTIONAL, ROLE_LABEL, ROLES_FOR, initialMode, initialPicks, toMapping, validate, type MoneyMode, type Picks, type Role } from "./mapping";
import { SampleTable } from "./SampleTable";

interface Props {
  headers: string[];
  sample: string[][];
  headerIndex: number;
  suggestion: Partial<ColumnMapping>;
  busy: boolean;
  onSubmit: (mapping: MappingPayload) => void;
  onCancel: () => void;
}

const selectClass =
  "h-11 w-full appearance-none rounded-md border border-line-strong bg-surface px-3 text-sm text-ink hover:border-muted focus-visible:border-ink";

export function MappingStep({ headers, sample, headerIndex, suggestion, busy, onSubmit, onCancel }: Props) {
  const [mode, setMode] = useState<MoneyMode>(() => initialMode(suggestion));
  const [picks, setPicks] = useState<Picks>(() => initialPicks(suggestion));
  const [error, setError] = useState<string | null>(null);
  const roles = ROLES_FOR[mode];

  function set(role: Role, value: string) {
    setPicks((p) => ({ ...p, [role]: value === "" ? null : Number(value) }));
    setError(null);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const problem = validate(picks, mode);
    if (problem) return setError(problem);
    onSubmit({ headerIndex, columns: toMapping(picks, mode) });
  }

  const tags = new Map<number, string>();
  for (const role of roles) if (picks[role] != null) tags.set(picks[role], ROLE_LABEL[role]);

  return (
    <form onSubmit={submit} className="animate-rise grid gap-6 rounded-md bg-surface p-4 shadow-paper sm:p-6">
      <div>
        <h2 className="text-h3 font-semibold">Which column is which?</h2>
        <p className="mt-1 text-sm text-muted">
          We didn&apos;t recognise this bank&apos;s layout. Match the columns once, using the sample rows below as a guide.
        </p>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">How does the file show money?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["split", "Two columns", "Separate Money out (debit) and Money in (credit)"],
              ["single", "One Amount column", "Negative = money out, or a Dr/Cr column says which"],
            ] as const
          ).map(([value, title, hint]) => (
            <label key={value} className={`press flex cursor-pointer gap-3 rounded-md border p-3 text-sm ${mode === value ? "border-ink bg-paper" : "border-line"}`}>
              <input type="radio" name="money-mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="mt-0.5 accent-(--accent-ink)" />
              <span>
                <span className="block font-medium">{title}</span>
                <span className="text-caption text-muted">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <div key={role} className="grid gap-1.5">
            <label htmlFor={`col-${role}`} className="text-sm font-medium">
              {ROLE_LABEL[role]} {OPTIONAL.includes(role) && <span className="font-normal text-muted">(optional)</span>}
            </label>
            <select id={`col-${role}`} value={picks[role] ?? ""} onChange={(e) => set(role, e.target.value)} className={selectClass}>
              <option value="">Not in this file</option>
              {headers.map((h, i) => (
                <option key={i} value={i}>
                  {h || `Column ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <SampleTable headers={headers} sample={sample} tags={tags} />
      <FormError key={error} message={error} />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" pending={busy}>
          {busy ? "Reading" : "Read with these columns"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Choose another file
        </Button>
      </div>
    </form>
  );
}
