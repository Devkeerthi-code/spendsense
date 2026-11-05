"use client";

import { useState } from "react";
import { ApiError, api, messageOf } from "@/client/api";
import type { ColumnMapping } from "@/lib/parsers/types";
import type { RowError } from "@/lib/parsers/types";
import type { ImportResponse } from "@/server/import";

export const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPTED = /\.(csv|pdf)$/i;

export interface MappingPayload {
  headerIndex: number;
  columns: ColumnMapping;
}

export type Step =
  | { kind: "pick" }
  | Extract<ImportResponse, { kind: "needs-password" }>
  | Extract<ImportResponse, { kind: "needs-mapping" }>
  | Extract<ImportResponse, { kind: "preview" }>
  | Extract<ImportResponse, { kind: "imported" }>;

export interface ImportProblem {
  message: string;
  rows: RowError[];
}

function rowsFrom(details: unknown): RowError[] {
  if (details && typeof details === "object" && "errors" in details && Array.isArray(details.errors)) {
    return (details.errors as RowError[]).slice(0, 20);
  }
  return [];
}

export function checkFile(file: File): string | null {
  if (!ACCEPTED.test(file.name)) return "Pick a .csv or .pdf statement. Excel files (.xls/.xlsx) need to be saved as CSV first.";
  if (file.size > MAX_BYTES) return "That file is over 4 MB. Download a shorter date range (3-6 months) and try again.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

/**
 * The import wizard's state. The File object lives only in this hook's memory between preview and commit;
 * the same bytes, password and mapping are resent for the commit so the preview is exactly what gets saved.
 */
export function useImportFlow() {
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string | undefined>();
  const [mapping, setMapping] = useState<MappingPayload | undefined>();
  const [busy, setBusy] = useState<"reading" | "saving" | null>(null);
  const [problem, setProblem] = useState<ImportProblem | null>(null);

  async function send(target: File, mode: "preview" | "commit", opts: { password?: string; mapping?: MappingPayload }) {
    const form = new FormData();
    form.set("file", target);
    form.set("mode", mode);
    if (opts.password) form.set("password", opts.password);
    if (opts.mapping) form.set("mapping", JSON.stringify(opts.mapping));
    setBusy(mode === "commit" ? "saving" : "reading");
    setProblem(null);
    try {
      setStep(await api<ImportResponse>("/api/import", { method: "POST", body: form }));
    } catch (err) {
      setProblem({ message: messageOf(err), rows: err instanceof ApiError ? rowsFrom(err.details) : [] });
    } finally {
      setBusy(null);
    }
  }

  function choose(next: File) {
    const invalid = checkFile(next);
    if (invalid) {
      setProblem({ message: invalid, rows: [] });
      return;
    }
    setFile(next);
    setPassword(undefined);
    setMapping(undefined);
    void send(next, "preview", {});
  }

  function unlock(pw: string) {
    if (!file) return;
    setPassword(pw);
    void send(file, "preview", { password: pw, mapping });
  }

  function mapColumns(m: MappingPayload) {
    if (!file) return;
    setMapping(m);
    void send(file, "preview", { password, mapping: m });
  }

  function commit() {
    if (file) void send(file, "commit", { password, mapping });
  }

  function reset() {
    setStep({ kind: "pick" });
    setFile(null);
    setPassword(undefined);
    setMapping(undefined);
    setProblem(null);
  }

  return { step, file, busy, problem, choose, unlock, mapColumns, commit, reset };
}
