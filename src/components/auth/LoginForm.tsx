"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { Field, FormError } from "@/components/ui/Field";

const INITIAL: LoginState = { error: null, email: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, INITIAL);
  return (
    <form action={action} className="grid gap-4">
      <Field label="Email" name="email" type="email" autoComplete="email" required inputMode="email" defaultValue={state.email} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <FormError key={state.error} message={state.error} />
      <Button type="submit" pending={pending} className="mt-2 w-full">
        {pending ? "Signing in" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-ink underline decoration-accent decoration-2 underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}
