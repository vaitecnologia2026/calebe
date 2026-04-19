import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  reason: z.string().min(3, "Informe o motivo").max(2000),
  notes: z.string().max(2000).optional()
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
    return NextResponse.json({ error: "Motivo obrigatório." }, { status: 422 });
  }

  const application = await db.brokerApplication.findUnique({ where: { id } });
  if (!application) {
    return NextResponse.json({ error: "Cadastro não encontrado." }, { status: 404 });
  }
  if (application.status === "APPROVED" || application.status === "DENIED") {
    return NextResponse.json(
      { error: `Cadastro já ${application.status === "APPROVED" ? "aprovado" : "negado"}.` },
      { status: 409 }
    );
  }

  const adminId = session.user.id as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  await db.$transaction(async (tx) => {
    await tx.brokerApplication.update({
      where: { id: application.id },
      data: {
        status: "DENIED",
        reviewedById: adminId,
        reviewedAt: new Date(),
        deniedReason: body.reason,
        reviewNotes: body.notes ?? null
      }
    });

    await tx.auditEvent.create({
      data: {
        actorUserId: adminId,
        actorRole: "ADMIN",
        action: "BROKER_DENIED",
        entityType: "BrokerApplication",
        entityId: application.id,
        metadata: { reason: body.reason },
        ipAddress,
        userAgent
      }
    });
  });

  return NextResponse.json({ ok: true });
}
