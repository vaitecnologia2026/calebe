import { redirect } from "next/navigation";
import { auth } from "@/auth";

const ROLE_ROOT: Record<string, string> = {
  ADMIN: "/app/admin",
  BROKER: "/app/corretor",
  LEGAL: "/app/juridico",
  SECRETARY: "/app/secretaria"
};

export default async function AppRootPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !ROLE_ROOT[role]) redirect("/login");
  redirect(ROLE_ROOT[role]);
}
