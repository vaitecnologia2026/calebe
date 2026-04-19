import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";

export const metadata = { title: "Meus Leads · Corretor — Calebe" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  NEW: "Novo",
  IN_CONTACT: "Em contato",
  QUALIFIED: "Qualificado",
  VISIT_SCHEDULED: "Visita agendada",
  PROPOSAL: "Proposta",
  WON: "Ganho",
  LOST: "Perdido"
};
const STATUS_CLASS: Record<string, string> = {
  NEW: "status-new",
  IN_CONTACT: "status-pending",
  QUALIFIED: "status-gold",
  VISIT_SCHEDULED: "status-gold",
  PROPOSAL: "status-gold",
  WON: "status-approved",
  LOST: "status-denied"
};

function fmtDate(d: Date): string {
  return d
    .toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
    .replace(",", " ·");
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
        <div className="card p-10 text-center text-sand-100/70">
          Seu cadastro de corretor ainda não foi vinculado.
        </div>
      </AppShell>
    );
  }

  const leads = await db.lead.findMany({
    where: { assignedBrokerId: broker.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      phoneMasked: true,
      source: true,
      city: true,
      status: true,
      assignedAt: true,
      createdAt: true
    }
  });

  const novos = leads.filter((l) => l.status === "NEW").length;
  const emAtendimento = leads.filter((l) =>
    ["IN_CONTACT", "QUALIFIED", "VISIT_SCHEDULED", "PROPOSAL"].includes(l.status)
  ).length;
  const ganhos = leads.filter((l) => l.status === "WON").length;

  return (
    <AppShell role="BROKER" userName={user.name}>
      <header className="mb-6">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Atendimento
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">Meus leads</h1>
        <p className="text-sand-100/65 mt-2 max-w-xl">
          Leads atribuídos a você. Telefone real acessível pelo admin apenas (auditado).
        </p>
      </header>

      <section className="grid grid-cols-3 gap-3 mb-6">
        <Kpi label="Total" value={leads.length} />
        <Kpi label="Novos" value={novos} />
        <Kpi label="Em atendimento" value={emAtendimento} />
      </section>

      <div className="card overflow-hidden">
        {leads.length === 0 ? (
          <div className="p-10 text-center text-sand-100/55">
            Você ainda não tem leads. Peça ao admin para distribuir ou aguarde o webhook.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
              <tr>
                <th className="text-left p-4">Nome</th>
                <th className="text-left p-4">Telefone</th>
                <th className="text-left p-4">Origem</th>
                <th className="text-left p-4">Cidade</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Recebido</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t hairline hover:bg-app-subtle/40">
                  <td className="p-4 font-medium">{l.fullName}</td>
                  <td className="p-4 text-xs text-sand-100/75">🔒 {l.phoneMasked}</td>
                  <td className="p-4 text-sand-100/85">{l.source}</td>
                  <td className="p-4 text-sand-100/85">{l.city ?? "—"}</td>
                  <td className="p-4">
                    <span className={`status ${STATUS_CLASS[l.status]}`}>
                      {STATUS_LABEL[l.status]}
                    </span>
                  </td>
                  <td className="p-4 text-sand-100/70 text-xs">
                    {fmtDate(l.assignedAt ?? l.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-sand-100/55 mt-3">
        🔒 O telefone real do cliente só é revelado em conversa via sistema — contato fora da
        plataforma viola o Termo de Adesão.
      </p>
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="text-[0.68rem] uppercase tracking-[0.14em] font-medium text-sand-100/55">
        {label}
      </p>
      <p className="text-3xl font-bold tracking-[-0.032em] mt-2">{value}</p>
    </div>
  );
}
