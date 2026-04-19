import { requireRole } from "@/lib/rbac";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const metadata = { title: "Solicitações · Secretaria — Calebe" };

export default async function Page() {
  const user = await requireRole(["SECRETARY", "ADMIN"]);
  return <PlaceholderPage role="SECRETARY" userName={user.name} title="Solicitações de Estrutura" />;
}
