import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-h1 font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 mb-8 text-muted">Free. You only need an email. Your bank login is never asked for.</p>
      <SignupForm />
    </>
  );
}
