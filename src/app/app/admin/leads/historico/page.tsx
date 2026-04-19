import { requireRole } from "@/lib/rbac";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const metadata = { title: "Histórico de Leads · Admin — Calebe" };

export default async function Page() {
  const user = await requireRole(["ADMIN"]);
  return <PlaceholderPage role="ADMIN" userName={user.name} title="Histórico de Leads" />;
}
