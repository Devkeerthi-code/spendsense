import { CATEGORY_LABEL } from "@/lib/categories";
import { formatINRExact } from "@/lib/money";
import { CategoryChip } from "@/components/category/CategoryChip";
import type { TxnRow } from "@/server/transactions";

interface Props {
  txn: TxnRow;
  onChangeCategory: (txn: TxnRow) => void;
  /** True right after a change so the chip plays its stamp. */
  justChanged: boolean;
}

/**
 * Phone: merchant | amount on top, raw bank line | chip below.
 * Desktop: merchant over raw line, then amount, then chip in fixed columns.
 */
export function TxnRowItem({ txn, onChangeCategory, justChanged }: Props) {
  const credit = txn.direction === "CREDIT";
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 [grid-template-areas:'m_a''r_c'] sm:grid-cols-[minmax(0,1fr)_auto_120px] sm:[grid-template-areas:'m_a_c''r_a_c']">
      <p className="truncate font-medium [grid-area:m]">{txn.merchant}</p>
      <details className="group min-w-0 [grid-area:r]">
        <summary className="num cursor-pointer list-none truncate text-caption text-muted group-open:hidden [&::-webkit-details-marker]:hidden">
          <span className="sr-only">Bank narration: </span>
          {txn.description}
        </summary>
        <p className="num text-caption break-all text-muted">{txn.description}</p>
      </details>
      <p className={`num text-right text-sm [grid-area:a] ${credit ? "text-positive" : ""}`}>
        <span className="sr-only">{credit ? "Received" : "Paid"} </span>
        {credit ? "+" : "−"}
        {formatINRExact(txn.amountPaise)}
      </p>
      <div className="justify-self-end [grid-area:c]">
        <button
          type="button"
          onClick={() => onChangeCategory(txn)}
          aria-label={`${CATEGORY_LABEL[txn.category]}. Change category for ${txn.merchant}`}
          className={`press block rounded-sm ${justChanged ? "animate-stamp" : ""}`}
        >
          <CategoryChip category={txn.category} short className="hover:border-ink" />
        </button>
      </div>
    </li>
  );
}
