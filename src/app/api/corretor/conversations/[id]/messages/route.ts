import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  contentText: z.string().min(1, "Mensagem vazia").max(4000)
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "BROKER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
  const { id } = await params;

  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.errors[0]?.message ?? "Dados inválidos." },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const conversation = await db.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      brokerId: true,
      leadId: true,
      status: true,
      broker: { select: { userId: true } }
    }
  });
  if (!conversation) {
    return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
  }
  if (conversation.status === "CLOSED") {
    return NextResponse.json({ error: "Conversa fechada." }, { status: 409 });
  }
  if (
    conversation.broker.userId !== session.user.id &&
    session.user.role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Conversa não pertence a você." }, { status: 403 });
  }

  const actorId = session.user.id as string;
  const actorRole = session.user.role as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const created = await db.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId: id,
        direction: "OUT",
        type: "TEXT",
        contentText: body.contentText,
        senderUserId: actorId
      },
      select: { id: true, createdAt: true }
    });
    await tx.conversation.update({
      where: { id },
      data: { lastMessageAt: msg.createdAt }
    });
    // Eleva lead para IN_CONTACT se ainda NEW
    await tx.lead.updateMany({
      where: { id: conversation.leadId, status: "NEW" },
      data: { status: "IN_CONTACT" }
    });
    await tx.auditEvent.create({
      data: {
        actorUserId: actorId,
        actorRole,
        action: "MESSAGE_SENT",
        entityType: "Conversation",
        entityId: id,
        metadata: { messageId: msg.id, length: body.contentText.length },
        ipAddress,
        userAgent
      }
    });
    return msg;
  });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
