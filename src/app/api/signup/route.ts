import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { signupSchema } from "@/lib/validation/schemas";
import { db } from "@/server/db";
import { errorResponse, readJson, withErrors } from "@/server/http";
import { track } from "@/server/usage";

export const POST = withErrors(async (req) => {
  const input = signupSchema.parse(await readJson(req));
  try {
    const user = await db.user.create({
      data: { name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 10) },
      select: { id: true },
    });
    await track("SIGNUP", user.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return errorResponse(409, "An account with this email already exists. Sign in instead.");
    }
    throw err;
  }
});
