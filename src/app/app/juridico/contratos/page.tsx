import { requireRole } from "@/lib/rbac";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const metadata = { title: "Contratos · Jurídico — Calebe" };

export default async function Page() {
  const user = await requireRole(["LEGAL", "ADMIN"]);
  return <PlaceholderPage role="LEGAL" userName={user.name} title="Contratos" />;
}
