import type { Metadata } from "next";
import { ImportFlow } from "@/components/import/ImportFlow";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Import statement" };

export default function ImportPage() {
  return (
    <>
      <PageHeader title="Import a statement" subtitle="SBI, HDFC, ICICI, Axis and Kotak are detected automatically. Any other bank's CSV works too." />
      <ImportFlow />
    </>
  );
}
