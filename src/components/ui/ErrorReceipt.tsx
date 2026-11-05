"use client";

import { useEffect } from "react";
import { Button, LinkButton } from "./Button";

/** Shared body for error boundaries: a torn receipt with a plain explanation and a way forward. */
export function ErrorReceipt({ error, retry, homeHref }: { error: unknown; retry: () => void; homeHref: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;

  return (
    <div role="alert" className="receipt-edge mx-auto mt-8 mb-2 w-full max-w-md rounded-t-md bg-surface px-6 pt-8 pb-10 shadow-paper">
      <p className="font-mono text-caption tracking-[0.08em] text-danger uppercase">Couldn&apos;t print this page</p>
      <h1 className="mt-2 text-h2 font-semibold">Something went wrong loading this.</h1>
      <p className="mt-2 text-sm text-muted">
        Usually it&apos;s a dropped connection or the database waking up. Your data is safe. Try again in a moment.
      </p>
      {digest && <p className="num mt-4 text-caption text-muted">Reference: {digest}</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={retry}>Try again</Button>
        <LinkButton href={homeHref} variant="ghost">
          Go back
        </LinkButton>
      </div>
    </div>
  );
}
