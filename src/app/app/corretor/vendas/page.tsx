import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";

export const metadata = { title: "Vendas · Corretor — Calebe" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  SUBMITTED: "Enviada",
  IN_LEGAL: "Em jurídico",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada"
};

const STATUS_CLASS: Record<string, string> = {
  DRAFT: "status-pending",
  SUBMITTED: "status-gold",
  IN_LEGAL: "status-gold",
  COMPLETED: "status-approved",
  CANCELLED: "status-denied"
};

function fmtBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default async function Page() {
  const user = await requireRole(["BROKER", "ADMIN"]);

  const broker = await db.broker.findFirst({
    where: { userId: user.id },
    select: { id: true }
  });

  if (!broker) {
    return (
      <AppShell role="BROKER" userName={user.name}>
        <div className="card p-10 text-center">
          <p className="text-sand-100/70">
            Seu cadastro de corretor ainda não foi vinculado. Fale com a administração.
          </p>
        </div>
      </AppShell>
    );
  }

  const sales = await db.sale.findMany({
    where: { brokerId: broker.id },
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { code: true, title: true } }
    }
  });

  const year = new Date().getFullYear();
  const rascunho = sales.filter((s) => s.status === "DRAFT").length;
  const emJuridico = sales.filter((s) => s.status === "SUBMITTED" || s.status === "IN_LEGAL")
    .length;
  const concluidas = sales.filter((s) => s.status === "COMPLETED").length;
  const totalAno = sales
    .filter((s) => s.createdAt.getFullYear() === year)
    .reduce((acc, s) => acc + Number(s.saleValue), 0);

  return (
    <AppShell role="BROKER" userName={user.name}>
      <header className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
            Pipeline
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">Minhas vendas</h1>
        </div>
        <Link
          href="/app/corretor/vendas/nova"
          className="btn-base btn-gold"
          style={{ padding: ".55rem 1.25rem" }}
        >
          + Registrar venda
        </Link>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Kpi label="Em rascunho" value={rascunho} />
        <Kpi label="Em jurídico" value={emJuridico} />
        <Kpi label="Concluídas" value={concluidas} />
        <Kpi label={`Total ${year}`} value={fmtBRL(totalAno)} />
      </section>

      <div className="card overflow-hidden">
        {sales.length === 0 ? (
          <div className="p-10 text-center text-sand-100/55">
            Nenhuma venda registrada ainda. Clique em &quot;Registrar venda&quot; para começar.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
              <tr>
                <th className="text-left p-4">#</th>
                <th className="text-left p-4">Imóvel</th>
                <th className="text-left p-4">Valor</th>
                <th className="text-left p-4">Criada</th>
                <th className="text-left p-4">Enviada</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-t hairline hover:bg-app-subtle/40">
                  <td className="p-4 text-xs font-mono text-gold-400">{s.id.slice(0, 8)}</td>
                  <td className="p-4">
                    {s.property.code} · {s.property.title}
                  </td>
                  <td className="p-4 font-semibold">{fmtBRL(Number(s.saleValue))}</td>
                  <td className="p-4 text-sand-100/70 text-xs">{fmtDate(s.createdAt)}</td>
                  <td className="p-4 text-sand-100/70 text-xs">{fmtDate(s.submittedAt)}</td>
                  <td className="p-4">
                    <span className={`status ${STATUS_CLASS[s.status] ?? "status-pending"}`}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-5">
      <p className="text-[0.68rem] uppercase tracking-[0.14em] font-medium text-sand-100/55">
        {label}
      </p>
      <p className="text-3xl font-bold tracking-[-0.032em] mt-2">{value}</p>
    </div>
  );
}
