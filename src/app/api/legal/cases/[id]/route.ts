import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z
    .enum(["RECEIVED", "REVIEWING", "DOCS_PENDING", "DRAFTING", "READY_TO_SIGN"])
    .optional(),
  legalNotes: z.string().max(4000).nullable().optional()
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    select: { id: true, status: true, legalNotes: true, saleId: true }
  });
  if (!existing) {
    return NextResponse.json({ error: "Processo não encontrado." }, { status: 404 });
  }
  if (existing.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Processo já finalizado — crie um novo contrato." },
      { status: 409 }
    );
  }

  const actorId = session.user.id as string;
  const actorRole = session.user.role as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  await db.$transaction(async (tx) => {
    await tx.legalCase.update({
      where: { id },
      data: {
        status: body.status ?? existing.status,
        legalNotes: body.legalNotes === undefined ? existing.legalNotes : body.legalNotes,
        assignedToId: existing.status === "RECEIVED" && body.status ? actorId : undefined
      }
    });

    if (body.status && body.status !== existing.status) {
      await tx.sale.update({
        where: { id: existing.saleId },
        data: { status: body.status === "READY_TO_SIGN" ? "IN_LEGAL" : "IN_LEGAL" }
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: actorId,
          actorRole,
          action: "LEGAL_STATUS_CHANGED",
          entityType: "LegalCase",
          entityId: id,
          metadata: { from: existing.status, to: body.status, saleId: existing.saleId },
          ipAddress,
          userAgent
        }
      });
    }
  });

  return NextResponse.json({ ok: true });
}
