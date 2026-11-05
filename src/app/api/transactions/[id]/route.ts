import { NextResponse } from "next/server";
import { recategoriseSchema } from "@/lib/validation/schemas";
import { readJson, withUser } from "@/server/http";
import { recategorise } from "@/server/transactions";

export const PATCH = withUser<{ params: Promise<{ id: string }> }>(async (req, userId, { params }) => {
  const { id } = await params;
  const input = recategoriseSchema.parse(await readJson(req));
  return NextResponse.json(await recategorise(userId, id, input.category, input.applyToMerchant));
});
