import { NextResponse } from "next/server";
import { budgetSchema } from "@/lib/validation/schemas";
import { db } from "@/server/db";
import { readJson, withUser } from "@/server/http";
import { track } from "@/server/usage";

/** Idempotent: setting the same limit twice leaves one budget row. A null limit removes it. */
export const PUT = withUser(async (req, userId) => {
  const { category, limitPaise } = budgetSchema.parse(await readJson(req));
  if (limitPaise === null) {
    await db.budget.deleteMany({ where: { userId, category } });
  } else {
    await db.budget.upsert({
      where: { userId_category: { userId, category } },
      create: { userId, category, limitPaise },
      update: { limitPaise },
    });
    await track("BUDGET_SET", userId);
  }
  return NextResponse.json({ category, limitPaise });
});
