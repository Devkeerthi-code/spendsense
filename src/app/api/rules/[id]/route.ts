import { NextResponse } from "next/server";
import { deleteRule } from "@/server/account";
import { HttpError, withUser } from "@/server/http";

export const DELETE = withUser<{ params: Promise<{ id: string }> }>(async (_req, userId, { params }) => {
  const { id } = await params;
  if (!(await deleteRule(userId, id))) throw new HttpError(404, "That rule was already removed.");
  return NextResponse.json({ ok: true });
});
