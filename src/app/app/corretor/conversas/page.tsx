import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";
import { ChatPane } from "@/components/corretor/ChatPane";

export const metadata = { title: "Conversas · Corretor — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ c?: string }>;
}) {
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

  const { c: activeIdFromUrl } = await searchParams;

  // Pega todas as conversas do corretor, criando uma para cada lead atribuído que ainda não tenha.
  const assignedLeads = await db.lead.findMany({
    where: { assignedBrokerId: broker.id },
    select: { id: true }
  });

  // Auto-create Conversation para leads sem uma
  if (assignedLeads.length > 0) {
    const existing = await db.conversation.findMany({
      where: { brokerId: broker.id },
      select: { leadId: true }
    });
    const existingSet = new Set(existing.map((c) => c.leadId));
    const toCreate = assignedLeads.filter((l) => !existingSet.has(l.id));
    if (toCreate.length > 0) {
      await db.conversation.createMany({
        data: toCreate.map((l) => ({ leadId: l.id, brokerId: broker.id })),
        skipDuplicates: true
      });
    }
  }

  const conversations = await db.conversation.findMany({
    where: { brokerId: broker.id },
    orderBy: [{ lastMessageAt: "desc" }, { openedAt: "desc" }],
    include: {
      lead: {
        select: { id: true, fullName: true, phoneMasked: true, status: true, source: true }
      }
    }
  });

  const convs = conversations.map((c) => ({
    id: c.id,
    leadId: c.leadId,
    leadName: c.lead.fullName,
    leadPhoneMasked: c.lead.phoneMasked,
    leadStatus: c.lead.status,
    leadSource: c.lead.source,
    status: c.status,
    lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
    openedAt: c.openedAt.toISOString()
  }));

  const activeId = activeIdFromUrl ?? convs[0]?.id ?? null;

  let messages: Array<{
    id: string;
    direction: "IN" | "OUT";
    type: string;
    contentText: string | null;
    createdAt: string;
  }> = [];

  if (activeId) {
    const msgs = await db.message.findMany({
      where: { conversationId: activeId },
      orderBy: { createdAt: "asc" },
      take: 200
    });
    messages = msgs.map((m) => ({
      id: m.id,
      direction: m.direction,
      type: m.type,
      contentText: m.contentText,
      createdAt: m.createdAt.toISOString()
    }));
  }

  return (
    <AppShell role="BROKER" userName={user.name}>
      <header className="mb-6">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Atendimento
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">Conversas</h1>
        <p className="text-sand-100/65 mt-2 max-w-xl">
          🔒 Telefone real nunca exibido. Toda conversa auditada.
        </p>
      </header>

      <ChatPane conversations={convs} activeId={activeId} messages={messages} />
    </AppShell>
  );
}
