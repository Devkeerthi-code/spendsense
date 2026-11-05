import type { CategoryId } from "@/lib/categories";
import type { Direction } from "@/lib/parsers/types";

export interface InsightTxn {
  date: string;
  amountPaise: number;
  direction: Direction;
  category: CategoryId;
  merchant: string;
  merchantKey: string;
}
