import type { Metadata } from "next";
import { Download } from "lucide-react";
import { BANK_LABEL } from "@/lib/parsers/types";
import { maskedAccount } from "@/lib/privacy";
import { SignOutButton } from "@/components/nav/SignOutButton";
import { DeleteData } from "@/components/settings/DeleteData";
import { RulesList } from "@/components/settings/RulesList";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LeaderRow } from "@/components/ui/Leader";
import { PageHeader } from "@/components/ui/PageHeader";
import { accountOverview } from "@/server/account";
import { currentUser } from "@/server/auth";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = (await currentUser())!;
  const { accounts, rules, txnCount, imports } = await accountOverview(user.id);

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card title="Account">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-muted">{user.email}</p>
          <div className="mt-4 -ml-3">
            <SignOutButton />
          </div>
        </Card>

        <Card title="Bank accounts">
          {accounts.length ? (
            <ul className="grid gap-2 text-sm">
              {accounts.map((a) => (
                <li key={a.id}>
                  <LeaderRow
                    label={
                      <>
                        <span className="font-medium">{BANK_LABEL[a.bank]}</span> <span className="num text-muted">{maskedAccount(a.last4)}</span>
                      </>
                    }
                    value={`${a._count.transactions} txns`}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No bank accounts yet. They appear after your first import.</p>
          )}
          <p className="mt-3 text-caption text-muted">
            {imports} import{imports === 1 ? "" : "s"} so far. Only the last four digits of an account number are ever stored.
          </p>
        </Card>

        <Card title="Always-categorise rules">
          <RulesList initial={rules} />
        </Card>

        <Card title="Your data">
          <p className="text-sm text-muted">Download every transaction as a CSV that opens in Excel or Google Sheets.</p>
          {txnCount ? (
            <a href="/api/export" download className={buttonClass("secondary", "md", "mt-4")}>
              <Download aria-hidden size={16} /> Export {txnCount} transactions
            </a>
          ) : (
            <p className="mt-4 text-sm text-muted">Nothing to export yet.</p>
          )}
        </Card>

        <section aria-labelledby="danger-title" className="rounded-md border border-danger/40 p-4 sm:p-6 lg:col-span-2">
          <h2 id="danger-title" className="font-mono text-caption font-medium tracking-[0.08em] text-danger uppercase">
            Danger zone
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted">Deleting is immediate and permanent.</p>
          <DeleteData txnCount={txnCount} />
        </section>
      </div>
    </>
  );
}
