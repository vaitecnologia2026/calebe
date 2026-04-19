import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  creciStatus: z.enum(["NOT_VERIFIED", "VALID", "INVALID"]),
  category: z.enum(["BRONZE", "SILVER", "GOLD", "DIAMOND"]),
  notes: z.string().max(2000).optional()
});

function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(8);
  let out = "Calebe-";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out + "!";
}

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
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }

  const application = await db.brokerApplication.findUnique({ where: { id } });
  if (!application) {
    return NextResponse.json({ error: "Cadastro não encontrado." }, { status: 404 });
  }
  if (application.status === "APPROVED") {
    return NextResponse.json({ error: "Cadastro já aprovado." }, { status: 409 });
  }

  const existingUser = await db.user.findUnique({ where: { email: application.email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "Já existe um usuário com este e-mail." },
      { status: 409 }
    );
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const adminId = session.user.id as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: application.email,
        passwordHash,
        name: application.fullName,
        cpf: application.cpf,
        phone: application.phone,
        role: "BROKER"
      },
      select: { id: true }
    });

    const broker = await tx.broker.create({
      data: {
        userId: user.id,
        applicationId: application.id,
        category: body.category,
        creci: application.creci,
        creciState: application.creciState,
        creciStatus: body.creciStatus,
        creciValidatedById: body.creciStatus !== "NOT_VERIFIED" ? adminId : null,
        creciValidatedAt: body.creciStatus !== "NOT_VERIFIED" ? new Date() : null,
        city: application.city,
        currentAgency: application.currentAgency,
        yearsMarket: application.yearsMarket,
        instagram: application.instagram,
        approvalStatus: "APPROVED",
        approvedById: adminId,
        approvedAt: new Date()
      },
      select: { id: true }
    });

    await tx.brokerApplication.update({
      where: { id: application.id },
      data: {
        status: "APPROVED",
        reviewedById: adminId,
        reviewedAt: new Date(),
        creciValidated: body.creciStatus,
        reviewNotes: body.notes ?? null
      }
    });

    await tx.auditEvent.create({
      data: {
        actorUserId: adminId,
        actorRole: "ADMIN",
        action: "BROKER_APPROVED",
        entityType: "BrokerApplication",
        entityId: application.id,
        metadata: {
          brokerId: broker.id,
          userId: user.id,
          category: body.category,
          creciStatus: body.creciStatus
        },
        ipAddress,
        userAgent
      }
    });

    return { userId: user.id, brokerId: broker.id };
  });

  return NextResponse.json({
    ok: true,
    userId: result.userId,
    brokerId: result.brokerId,
    tempPassword
  });
}
