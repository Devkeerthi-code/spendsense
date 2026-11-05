"use client";

import { ErrorReceipt } from "@/components/ui/ErrorReceipt";

export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="px-4 py-8">
      <ErrorReceipt error={error} retry={retry} homeHref="/" />
    </main>
  );
}
