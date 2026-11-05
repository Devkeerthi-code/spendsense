import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-h1 font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 mb-8 text-muted">Pick up where your last statement left off.</p>
      <LoginForm />
    </>
  );
}
