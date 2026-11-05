"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { loginAction } from "@/app/(auth)/actions";
import { api, jsonInit, messageOf } from "@/client/api";
import { Button } from "@/components/ui/Button";
import { Field, FormError } from "@/components/ui/Field";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await api("/api/signup", jsonInit("POST", Object.fromEntries(form)));
      } catch (err) {
        setError(messageOf(err));
        return;
      }
      const result = await loginAction({ error: null, email: "" }, form);
      if (result.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field label="Your name" name="name" autoComplete="given-name" required maxLength={60} />
      <Field label="Email" name="email" type="email" autoComplete="email" required inputMode="email" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={72}
        hint="At least 8 characters."
      />
      <FormError key={error} message={error} />
      <Button type="submit" pending={pending} className="mt-2 w-full">
        {pending ? "Creating account" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted">
        Already have one?{" "}
        <Link href="/login" className="font-medium text-ink underline decoration-accent decoration-2 underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
