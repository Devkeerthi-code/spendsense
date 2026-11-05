import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { currentUserId } from "./auth";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function errorResponse(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

function toResponse(err: unknown) {
  // Next.js signals (redirects, prerender bail-outs) travel as thrown errors and must not become 500s.
  unstable_rethrow(err);
  if (err instanceof HttpError) return errorResponse(err.status, err.message, err.details);
  if (err instanceof ZodError) return errorResponse(400, err.issues[0]?.message ?? "Invalid input", err.issues);
  console.error(err);
  return errorResponse(500, "Something went wrong on our side. Try again in a moment.");
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Request body must be JSON.");
  }
}

/** Wraps a route handler: requires a signed-in user and maps thrown errors to JSON responses. */
export function withUser<Ctx>(handler: (req: Request, userId: string, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      const userId = await currentUserId();
      if (!userId) return errorResponse(401, "Your session ended. Sign in again.");
      return await handler(req, userId, ctx);
    } catch (err) {
      return toResponse(err);
    }
  };
}

export function withErrors<Ctx>(handler: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return toResponse(err);
    }
  };
}
