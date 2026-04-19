import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";
import { AuditLogList } from "@/components/admin/AuditLogList";

export const metadata = { title: "Auditoria · Admin — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const admin = await requireRole(["ADMIN"]);

  const events = await db.auditEvent.findMany({
    orderBy: { occurredAt: "desc" },
    take: 500
  });

  const actorIds = Array.from(
    new Set(events.map((e) => e.actorUserId).filter((v): v is string => v != null))
  );
  const actors = actorIds.length
    ? await db.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, role: true }
      })
    : [];
  const actorById = new Map(actors.map((a) => [a.id, a]));

  const rows = events.map((e) => {
    const actor = e.actorUserId ? actorById.get(e.actorUserId) : null;
    return {
      id: e.id,
      quando: e.occurredAt.toISOString(),
      actorLabel: actor
        ? `${actor.name} (${actor.role.toLowerCase()})`
        : e.actorRole
          ? `${e.actorRole.toLowerCase()}`
          : "sistema",
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId,
      ipAddress: e.ipAddress,
      metadata: e.metadata as Record<string, unknown> | null
    };
  });

  const actions = Array.from(new Set(rows.map((r) => r.action))).sort();

  return (
    <AppShell role="ADMIN" userName={admin.name}>
      <div className="flex flex-wrap justify-between items-end gap-3 mt-2 mb-6">
        <div>
          <p
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.7rem] uppercase tracking-[0.14em] font-medium"
            style={{
              borderColor: "rgba(201,169,97,0.22)",
              background: "rgba(201,169,97,0.06)",
              color: "#DEB96D"
            }}
          >
            🔒 Imutável
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.024em] mt-2">
            Auditoria &amp; Logs
          </h1>
        </div>
      </div>

      <AuditLogList rows={rows} actions={actions} />

      <p className="text-xs text-sand-100/55 mt-3">
        Triggers Postgres impedem UPDATE/DELETE nessa tabela. O histórico completo é a prova
        operacional da Calebe.
      </p>
    </AppShell>
  );
}
