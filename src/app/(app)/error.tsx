"use client";

import { ErrorReceipt } from "@/components/ui/ErrorReceipt";

export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorReceipt error={error} retry={retry} homeHref="/dashboard" />;
}
