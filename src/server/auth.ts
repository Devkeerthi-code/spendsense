import bcrypt from "bcryptjs";
import NextAuth, { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/validation/schemas";
import { db } from "./db";
import { track } from "./usage";

// Compared against when the email doesn't exist, so response time doesn't reveal which emails are registered.
const DUMMY_HASH = "$2b$10$5rdFVdxsz9XUBlmJrJhIx.sBHG4/aUfOw.o3t1BwPNP9xhRN2Ianq";

const EXPECTED_AUTH_ERRORS = new Set(["JWTSessionError", "CredentialsSignin"]);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  trustHost: true,
  logger: {
    // A stale cookie or a wrong password is normal traffic, not a server error.
    error(error) {
      const kind = error instanceof AuthError ? error.type : error.name;
      if (!EXPECTED_AUTH_ERRORS.has(kind)) console.error(error);
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !ok) return null;
        await track("LOGIN", user.id);
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});

/** The signed-in user, re-checked against the database so a deleted account's old cookie gets nothing. */
export async function currentUser(): Promise<{ id: string; name: string; email: string; isDemo: boolean } | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return db.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, isDemo: true } });
}

export async function currentUserId(): Promise<string | null> {
  return (await currentUser())?.id ?? null;
}
