import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { SaleForm } from "@/components/corretor/SaleForm";

export const metadata = { title: "Registrar Venda · Corretor — Calebe" };

export default async function Page() {
  const user = await requireRole(["BROKER", "ADMIN"]);

  return (
    <AppShell role="BROKER" userName={user.name}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
            Pipeline
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">Registrar Venda</h1>
          <p className="text-sand-100/65 mt-2 max-w-xl">
            Preencha em 5 etapas: imóvel, comprador, cônjuge, negociação e documentos. Salve como
            rascunho a qualquer momento.
          </p>
        </div>
        <Link
          href="/app/corretor/vendas"
          className="btn-base btn-outline"
          style={{ padding: ".55rem 1.1rem" }}
        >
          ← Voltar
        </Link>
      </header>

      <SaleForm />
    </AppShell>
  );
}
