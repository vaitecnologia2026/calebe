import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  rules: z
    .array(
      z.object({
        category: z.enum(["BRONZE", "SILVER", "GOLD", "DIAMOND"]),
        leadsPerDay: z.number().int().min(0).max(50)
      })
    )
    .min(1)
});

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 422 });
  }

  const adminId = session.user.id as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  await db.$transaction(async (tx) => {
    for (const rule of body.rules) {
      await tx.leadDistributionRule.upsert({
        where: { category: rule.category },
        create: {
          category: rule.category,
          leadsPerDay: rule.leadsPerDay,
          isActive: true
        },
        update: {
          leadsPerDay: rule.leadsPerDay,
          isActive: true
        }
      });
    }
    await tx.auditEvent.create({
      data: {
        actorUserId: adminId,
        actorRole: "ADMIN",
        action: "DISTRIBUTION_RULES_UPDATED",
        entityType: "LeadDistributionRule",
        entityId: null,
        metadata: { rules: body.rules },
        ipAddress,
        userAgent
      }
    });
  });

  return NextResponse.json({ ok: true });
}
