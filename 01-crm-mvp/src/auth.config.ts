import type { NextAuthConfig } from "next-auth";

/**
 * Config edge-compatible — usado pelo middleware.
 * NÃO incluir providers que dependem de Node.js (Prisma, bcrypt) aqui.
 */
export default {
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.userId = (user as { id?: string }).id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.userId as string | undefined;
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    }
  }
} satisfies NextAuthConfig;

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id?: string;
      role?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: string;
  }
}
