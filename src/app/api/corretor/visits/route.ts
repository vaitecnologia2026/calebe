import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  leadId: z.string().min(1, "Lead obrigatório"),
  propertyId: z.string().min(1, "Imóvel obrigatório"),
  scheduledAt: z.string().min(10, "Data e hora obrigatórias"),
  notes: z.string().max(2000).optional()
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "BROKER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const broker = await db.broker.findFirst({
    where: { userId: session.user.id },
    select: { id: true }
  });
  if (!broker) {
    return NextResponse.json(
      { error: "Usuário não está vinculado a um cadastro de corretor." },
      { status: 409 }
    );
  }

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

  const scheduled = new Date(body.scheduledAt);
  if (Number.isNaN(scheduled.getTime())) {
    return NextResponse.json({ error: "Data inválida." }, { status: 422 });
  }

  // Verify lead assigned to this broker
  const lead = await db.lead.findUnique({
    where: { id: body.leadId },
    select: { id: true, assignedBrokerId: true }
  });
  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
  }
  if (lead.assignedBrokerId !== broker.id && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Lead não está atribuído a você." },
      { status: 403 }
    );
  }

  const property = await db.property.findUnique({
    where: { id: body.propertyId },
    select: { id: true }
  });
  if (!property) {
    return NextResponse.json({ error: "Imóvel não encontrado." }, { status: 404 });
  }

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const created = await db.$transaction(async (tx) => {
    const visit = await tx.visit.create({
      data: {
        brokerId: broker.id,
        leadId: body.leadId,
        propertyId: body.propertyId,
        scheduledAt: scheduled,
        status: "SCHEDULED",
        notes: body.notes ?? null
      },
      select: { id: true }
    });
    await tx.lead.update({
      where: { id: body.leadId },
      data: { status: "VISIT_SCHEDULED" }
    });
    await tx.auditEvent.create({
      data: {
        actorUserId: session.user.id as string,
        actorRole: session.user.role as string,
        action: "VISIT_SCHEDULED",
        entityType: "Visit",
        entityId: visit.id,
        metadata: {
          leadId: body.leadId,
          propertyId: body.propertyId,
          scheduledAt: scheduled.toISOString()
        },
        ipAddress,
        userAgent
      }
    });
    return visit;
  });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
