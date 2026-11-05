"use client";

import { FileText, Upload } from "lucide-react";
import { useState, type DragEvent } from "react";
import { Spinner } from "@/components/ui/Spinner";

interface Props {
  busy: boolean;
  onFile: (file: File) => void;
}

/** A receipt slot you drop a statement into. Click, keyboard and drag-and-drop all work. */
export function DropZone({ busy, onFile }: Props) {
  const [over, setOver] = useState(false);

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file && !busy) onFile(file);
  }

  return (
    <label
      htmlFor="statement-file"
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={`group relative flex min-h-64 flex-col items-center justify-center gap-3 overflow-hidden rounded-md border-2 border-dashed px-6 py-10 text-center transition-[border-color,background-color,transform] duration-180 ease-(--ease-spring) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-ink ${
        over ? "scale-[1.01] border-accent-ink bg-accent/10" : "border-line-strong bg-surface hover:border-ink"
      } ${busy ? "pointer-events-none" : "cursor-pointer"}`}
    >
      {busy && <span aria-hidden className="scan-line absolute inset-x-0 top-0 h-0.5 bg-accent" />}
      <span className={`flex size-12 items-center justify-center rounded-md transition-transform duration-180 ease-(--ease-spring) ${over ? "-translate-y-1 bg-accent text-on-accent" : "bg-ink text-paper group-hover:-translate-y-0.5"}`}>
        {busy ? <Spinner size={20} /> : over ? <FileText aria-hidden size={20} /> : <Upload aria-hidden size={20} />}
      </span>
      <span className="text-h3 font-semibold">{busy ? "Reading your statement" : over ? "Drop it here" : "Drop your bank statement"}</span>
      <span className="max-w-sm text-sm text-muted">
        {busy ? "Finding transactions and decoding each line. Big PDFs take a few seconds." : "or tap to choose a file. CSV or PDF, up to 4 MB."}
      </span>
      <input
        id="statement-file"
        type="file"
        accept=".csv,.pdf,text/csv,application/pdf"
        disabled={busy}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}
