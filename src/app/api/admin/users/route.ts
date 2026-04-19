import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(3).max(120),
  email: z.string().email().max(160),
  role: z.enum(["ADMIN", "BROKER", "LEGAL", "SECRETARY"]),
  phone: z.string().max(30).nullable().optional()
});

function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(8);
  let out = "Calebe-";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out + "!";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }

  const existing = await db.user.findUnique({ where: { email: body.email } });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe usuário com este e-mail." },
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

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role,
        phone: body.phone ?? null
      },
      select: { id: true, email: true }
    });
    await tx.auditEvent.create({
      data: {
        actorUserId: adminId,
        actorRole: "ADMIN",
        action: "USER_CREATED",
        entityType: "User",
        entityId: created.id,
        metadata: { email: created.email, role: body.role },
        ipAddress,
        userAgent
      }
    });
    return created;
  });

  return NextResponse.json({
    ok: true,
    userId: user.id,
    email: user.email,
    tempPassword
  });
}
