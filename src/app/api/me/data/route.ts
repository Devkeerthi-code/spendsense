import { NextResponse } from "next/server";
import { deleteDataSchema } from "@/lib/validation/schemas";
import { deleteAllData } from "@/server/account";
import { readJson, withUser } from "@/server/http";

export const DELETE = withUser(async (req, userId) => {
  const { scope } = deleteDataSchema.parse(await readJson(req));
  await deleteAllData(userId, scope);
  return NextResponse.json({ ok: true, scope });
});
