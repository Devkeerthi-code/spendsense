"use client";

import { CircleAlert, ShieldCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { DropZone } from "./DropZone";
import { ImportedReceipt } from "./ImportedReceipt";
import { MappingStep } from "./MappingStep";
import { PasswordStep } from "./PasswordStep";
import { PreviewStep } from "./PreviewStep";
import { RowErrors } from "./RowErrors";
import { StatementHelp } from "./StatementHelp";
import { useImportFlow, type ImportProblem } from "./useImportFlow";

const STAGES = ["Choose file", "Check", "Done"] as const;

function stageOf(kind: string): number {
  if (kind === "imported") return 2;
  return kind === "pick" ? 0 : 1;
}

function Stages({ current }: { current: number }) {
  return (
    <ol className="mb-6 flex items-center gap-2 font-mono text-caption tracking-[0.06em] uppercase">
      {STAGES.map((label, i) => (
        <li key={label} aria-current={i === current ? "step" : undefined} className="flex items-center gap-2">
          <span className={`flex size-6 items-center justify-center rounded-full border ${i <= current ? "border-ink bg-ink text-paper" : "border-line-strong text-muted"}`}>
            {i + 1}
          </span>
          <span className={i === current ? "text-ink" : "text-muted"}>{label}</span>
          {i < STAGES.length - 1 && <span aria-hidden className="w-6 border-t border-dashed border-line-strong sm:w-12" />}
        </li>
      ))}
    </ol>
  );
}

function Problem({ problem }: { problem: ImportProblem }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), [problem]);
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="animate-nudge mb-4 grid gap-3 rounded-md border border-danger/40 bg-danger-soft p-4 text-sm">
      <p className="flex gap-2 font-medium text-danger">
        <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
        {problem.message}
      </p>
      <RowErrors errors={problem.rows} />
    </div>
  );
}

export function ImportFlow() {
  const flow = useImportFlow();
  const { step, busy, problem } = flow;

  return (
    <div>
      <Stages current={stageOf(step.kind)} />
      {problem && <Problem problem={problem} />}

      {step.kind === "pick" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <DropZone busy={busy === "reading"} onFile={flow.choose} />
            <p className="mt-3 flex items-start gap-2 text-sm text-muted">
              <ShieldCheck aria-hidden size={16} className="mt-0.5 shrink-0 text-positive" />
              Your file is read in memory and never stored. Account numbers are masked to the last 4 digits.
            </p>
          </div>
          <div className="min-w-0 lg:col-span-5">
            <StatementHelp />
          </div>
        </div>
      )}

      {step.kind === "needs-password" && (
        <PasswordStep
          fileName={flow.file?.name ?? "statement.pdf"}
          wrongPassword={step.wrongPassword}
          busy={busy !== null}
          onUnlock={flow.unlock}
          onCancel={flow.reset}
        />
      )}

      {step.kind === "needs-mapping" && (
        <MappingStep
          headers={step.headers}
          sample={step.sample}
          headerIndex={step.headerIndex}
          suggestion={step.suggestion}
          busy={busy !== null}
          onSubmit={flow.mapColumns}
          onCancel={flow.reset}
        />
      )}

      {step.kind === "preview" && <PreviewStep preview={step} busy={busy !== null} onCommit={flow.commit} onCancel={flow.reset} />}

      {step.kind === "imported" && <ImportedReceipt result={step} onAnother={flow.reset} />}
    </div>
  );
}
