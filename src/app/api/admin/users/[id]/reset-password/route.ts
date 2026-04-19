import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true }
  });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const adminId = session.user.id as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { passwordHash } });
    await tx.auditEvent.create({
      data: {
        actorUserId: adminId,
        actorRole: "ADMIN",
        action: "USER_PASSWORD_RESET",
        entityType: "User",
        entityId: id,
        metadata: { email: user.email },
        ipAddress,
        userAgent
      }
    });
  });

  return NextResponse.json({ ok: true, email: user.email, tempPassword });
}
