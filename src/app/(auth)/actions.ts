"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/validation/schemas";
import { signIn } from "@/server/auth";

export interface LoginState {
  error: string | null;
  /** Echoed back so the email field survives React's form reset after a failed attempt. */
  email: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your email and password.", email };
  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Email or password is wrong.", email };
    throw err;
  }
  redirect("/dashboard");
}
