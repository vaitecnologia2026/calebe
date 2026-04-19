import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

/**
 * Helper para Server Components: garante sessão e role permitida.
 * Retorna o user ou redireciona para /login.
 *
 * Uso:
 *   const user = await requireRole(["ADMIN", "SECRETARY"]);
 */
export async function requireRole(allowed: Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role as Role | undefined;
  if (!role || !allowed.includes(role)) {
    redirect("/login?error=forbidden");
  }
  return session.user as { id: string; email: string; name: string; role: Role };
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user as { id?: string; email?: string; name?: string; role?: Role } | null;
}
