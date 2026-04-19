import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { brokerApplicationSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  let data;
  try {
    data = brokerApplicationSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of e.errors) {
        const key = issue.path.join(".") || "_form";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return NextResponse.json({ error: "Validação falhou.", fieldErrors }, { status: 422 });
    }
    throw e;
  }

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const existing = await db.brokerApplication.findFirst({
    where: {
      OR: [
        { cpf: data.cpf, status: { in: ["PENDING", "REVIEWING", "APPROVED"] } },
        { email: data.email, status: { in: ["PENDING", "REVIEWING", "APPROVED"] } },
        { creci: data.creci, status: { in: ["PENDING", "REVIEWING", "APPROVED"] } }
      ]
    },
    select: { id: true, status: true }
  });

  if (existing) {
    return NextResponse.json(
      {
        error:
          "Já existe um cadastro em andamento com estes dados. Aguarde o retorno da equipe Calebe."
      },
      { status: 409 }
    );
  }

  const application = await db.brokerApplication.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      cpf: data.cpf,
      rg: data.rg,
      creci: data.creci,
      creciState: data.creciState,
      city: data.city,
      currentAgency: data.currentAgency || null,
      yearsMarket: data.yearsMarket ?? null,
      instagram: data.instagram || null,
      credentialFileUrl: data.credentialFileUrl,
      notes: data.notes || null,
      ipAddress,
      userAgent
    },
    select: { id: true, submittedAt: true }
  });

  await db.auditEvent.create({
    data: {
      action: "BROKER_APPLICATION_SUBMITTED",
      entityType: "BrokerApplication",
      entityId: application.id,
      metadata: { email: data.email, creci: `${data.creci}/${data.creciState}` },
      ipAddress,
      userAgent
    }
  });

  return NextResponse.json({ id: application.id, submittedAt: application.submittedAt }, { status: 201 });
}
