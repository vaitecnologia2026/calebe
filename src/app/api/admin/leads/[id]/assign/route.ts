import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  brokerId: z.string().nullable()
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
  const { id } = await params;

  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 422 });
  }

  const lead = await db.lead.findUnique({
    where: { id },
    select: { id: true, assignedBrokerId: true }
  });
  if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

  if (body.brokerId) {
    const broker = await db.broker.findUnique({
      where: { id: body.brokerId },
      select: { id: true, approvalStatus: true, user: { select: { isActive: true } } }
    });
    if (!broker) {
      return NextResponse.json({ error: "Corretor não encontrado." }, { status: 404 });
    }
    if (broker.approvalStatus !== "APPROVED" || !broker.user.isActive) {
      return NextResponse.json(
        { error: "Corretor não está ativo ou aprovado." },
        { status: 409 }
      );
    }
  }

  if (lead.assignedBrokerId === body.brokerId) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  const adminId = session.user.id as string;
  const prevBrokerId = lead.assignedBrokerId;
  const isUnassign = body.brokerId === null;

  await db.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id },
      data: {
        assignedBrokerId: body.brokerId,
        assignedAt: body.brokerId ? new Date() : null
      }
    });

    await tx.leadAssignmentEvent.create({
      data: {
        leadId: id,
        brokerId: body.brokerId,
        event: isUnassign ? "UNASSIGNED" : prevBrokerId ? "REASSIGNED" : "ASSIGNED",
        actorUserId: adminId,
        reason: "manual_admin"
      }
    });

    if (body.brokerId) {
      await tx.leadDistribution.upsert({
        where: { leadId_brokerId: { leadId: id, brokerId: body.brokerId } },
        create: {
          leadId: id,
          brokerId: body.brokerId,
          distributionDate: new Date()
        },
        update: {}
      });
    }
  });

  return NextResponse.json({ ok: true });
}
