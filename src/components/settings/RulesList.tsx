"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CategoryId } from "@/lib/categories";
import { api, messageOf } from "@/client/api";
import { CategoryChip } from "@/components/category/CategoryChip";
import { Spinner } from "@/components/ui/Spinner";

interface Rule {
  id: string;
  merchantKey: string;
  merchant: string;
  category: CategoryId;
}

/** The key is only worth showing when it isn't just the display name lower-cased (e.g. a VPA). */
function showKey(rule: Rule): boolean {
  const simplify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return simplify(rule.merchant) !== simplify(rule.merchantKey);
}

export function RulesList({ initial }: { initial: Rule[] }) {
  const [rules, setRules] = useState(initial);
  const [removing, setRemoving] = useState<string | null>(null);

  async function remove(rule: Rule) {
    setRemoving(rule.id);
    try {
      await api(`/api/rules/${rule.id}`, { method: "DELETE" });
      setRules((list) => list.filter((r) => r.id !== rule.id));
      toast.success(`Rule for ${rule.merchant} removed. Past transactions keep their category.`);
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setRemoving(null);
    }
  }

  if (!rules.length) {
    return (
      <p className="text-sm text-muted">
        None yet. When you change a category on Transactions and tick &quot;Always categorise&quot;, the rule shows up here.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-dashed divide-line-strong">
      {rules.map((rule) => (
        <li key={rule.id} className="flex items-center gap-3 py-2.5">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{rule.merchant}</span>
            {showKey(rule) && <span className="num block truncate text-caption text-muted">{rule.merchantKey}</span>}
          </span>
          <CategoryChip category={rule.category} short />
          <button
            type="button"
            onClick={() => remove(rule)}
            disabled={removing !== null}
            aria-label={`Remove rule for ${rule.merchant}`}
            className="press flex size-9 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-ink disabled:opacity-50"
          >
            {removing === rule.id ? <Spinner /> : <X aria-hidden size={16} />}
          </button>
        </li>
      ))}
    </ul>
  );
}
