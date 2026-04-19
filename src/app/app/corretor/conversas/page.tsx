import { requireRole } from "@/lib/rbac";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const metadata = { title: "Conversas · Corretor — Calebe" };

export default async function Page() {
  const user = await requireRole(["BROKER", "ADMIN"]);
  return <PlaceholderPage role="BROKER" userName={user.name} title="Conversas" />;
}
