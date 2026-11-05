"use client";

import { Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

interface Props {
  fileName: string;
  wrongPassword: boolean;
  busy: boolean;
  onUnlock: (password: string) => void;
  onCancel: () => void;
}

export function PasswordStep({ fileName, wrongPassword, busy, onUnlock, onCancel }: Props) {
  const [value, setValue] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (value) onUnlock(value);
  }

  return (
    <form onSubmit={onSubmit} className="animate-rise mx-auto grid max-w-md gap-4 rounded-md bg-surface p-6 shadow-paper">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-md bg-sunken">
          <Lock aria-hidden size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-h3 font-semibold">This PDF is locked</h2>
          <p className="num truncate text-caption text-muted">{fileName}</p>
        </div>
      </div>
      <p className="text-sm text-muted">
        Banks lock e-statements with a password, often your customer ID, or part of your name plus your date of birth. It&apos;s
        printed in the email the statement came with. The password is only used to open this file and is not saved.
      </p>
      <Field
        label="Statement password"
        name="pdf-password"
        type="password"
        autoComplete="off"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={wrongPassword ? "That password didn't open the file. Check the email from your bank and try again." : null}
        maxLength={100}
        required
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" pending={busy} disabled={!value}>
          {busy ? "Opening" : "Open statement"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Choose another file
        </Button>
      </div>
    </form>
  );
}
