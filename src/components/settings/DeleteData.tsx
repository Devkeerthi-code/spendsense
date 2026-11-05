"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { signOutAction } from "@/app/(app)/actions";
import { api, jsonInit, messageOf } from "@/client/api";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";

type Scope = "data" | "account";

const SCOPES: { value: Scope; title: string; body: string }[] = [
  { value: "data", title: "Delete my data", body: "Transactions, rules, budgets and bank accounts. You stay signed in." },
  { value: "account", title: "Delete my account", body: "Everything above plus your login. You're signed out." },
];

export function DeleteData({ txnCount }: { txnCount: number }) {
  const router = useRouter();
  const [scope, setScope] = useState<Scope>("data");
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const ready = typed === "DELETE";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setPending(true);
    try {
      await api("/api/me/data", jsonInit("DELETE", { confirm: "DELETE", scope }));
    } catch (err) {
      toast.error(messageOf(err));
      setPending(false);
      return;
    }
    // Outside the try: signOut redirects by throwing, and that must reach Next.js rather than a toast.
    if (scope === "account") return signOutAction();
    toast.success("All your data is deleted. Import a statement to start again.");
    setTyped("");
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">What to delete</legend>
        {SCOPES.map((s) => (
          <label key={s.value} className={`press flex cursor-pointer gap-3 rounded-md border p-3 text-sm ${scope === s.value ? "border-danger bg-danger-soft" : "border-line"}`}>
            <input type="radio" name="scope" value={s.value} checked={scope === s.value} onChange={() => setScope(s.value)} className="mt-0.5 accent-(--danger)" />
            <span>
              <span className="block font-medium">{s.title}</span>
              <span className="text-caption text-muted">{s.body}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="grid gap-1.5">
        <label htmlFor="confirm-delete" className="text-sm font-medium">
          Type <span className="num rounded-sm bg-sunken px-1">DELETE</span> to confirm
        </label>
        <input
          id="confirm-delete"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className={`${inputClass} num max-w-60`}
        />
        <p className="text-caption text-muted">
          {txnCount} transaction{txnCount === 1 ? "" : "s"} will be removed. This can&apos;t be undone; export a CSV first if you want a copy.
        </p>
      </div>
      <div>
        <Button type="submit" variant="danger" pending={pending} disabled={!ready}>
          {pending ? "Deleting" : scope === "account" ? "Delete my account" : "Delete all my data"}
        </Button>
      </div>
    </form>
  );
}
