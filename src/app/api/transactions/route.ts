import { NextResponse } from "next/server";
import { transactionQuerySchema } from "@/lib/validation/schemas";
import { withUser } from "@/server/http";
import { listTransactions } from "@/server/transactions";

export const GET = withUser(async (req, userId) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const filter = transactionQuerySchema.parse(params);
  return NextResponse.json(await listTransactions(userId, filter));
});
