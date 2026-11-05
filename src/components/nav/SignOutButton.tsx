"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { signOutAction } from "@/app/(app)/actions";
import { Spinner } from "@/components/ui/Spinner";

function Submit({ className }: { className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? <Spinner size={18} /> : <LogOut aria-hidden size={18} />}
      {pending ? "Signing out" : "Sign out"}
    </button>
  );
}

export function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <Submit
        className={`press flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted hover:bg-sunken hover:text-ink disabled:opacity-60 ${className}`}
      />
    </form>
  );
}
