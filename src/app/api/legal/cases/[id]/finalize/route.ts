import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  outcome: z.enum(["approve", "deny"]),
  notes: z.string().max(4000).optional()
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "LEGAL" && session.user.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
  const { id } = await params;

  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 422 });
  }

  const existing = await db.legalCase.findUnique({
    where: { id },
    select: { id: true, status: true, saleId: true }
  });
  if (!existing) {
    return NextResponse.json({ error: "Processo não encontrado." }, { status: 404 });
  }
  if (existing.status === "COMPLETED") {
    return NextResponse.json({ error: "Já finalizado." }, { status: 409 });
  }

  const actorId = session.user.id as string;
  const actorRole = session.user.role as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const isApprove = body.outcome === "approve";

  await db.$transaction(async (tx) => {
    await tx.legalCase.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        legalNotes: body.notes ?? undefined
      }
    });
    await tx.sale.update({
      where: { id: existing.saleId },
      data: { status: isApprove ? "COMPLETED" : "CANCELLED" }
    });

    if (isApprove) {
      // Cria Commission PENDING para o corretor receber
      const sale = await tx.sale.findUnique({
        where: { id: existing.saleId },
        include: { property: { select: { commissionPct: true } } }
      });
      if (sale) {
        const gross = Number(sale.saleValue) * (Number(sale.property.commissionPct) / 100);
        const net = gross * 0.8; // 20% de retenção aproximada — ajuste conforme regra real
        await tx.commission.upsert({
          where: { saleId: sale.id },
          create: {
            saleId: sale.id,
            brokerId: sale.brokerId,
            grossValue: gross,
            netValue: net,
            status: "PENDING"
          },
          update: {
            grossValue: gross,
            netValue: net,
            status: "PENDING"
          }
        });
      }
    }

    await tx.auditEvent.create({
      data: {
        actorUserId: actorId,
        actorRole,
        action: isApprove ? "LEGAL_APPROVED" : "LEGAL_DENIED",
        entityType: "LegalCase",
        entityId: id,
        metadata: { saleId: existing.saleId, notes: body.notes ?? null },
        ipAddress,
        userAgent
      }
    });
  });

  return NextResponse.json({ ok: true });
}
