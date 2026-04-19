import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { encrypt, maskPhone, sha256Hex } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  mode: z.enum(["draft", "submit"]),
  imovel: z.object({
    code: z.string().optional(),
    title: z.string().min(3, "Informe o título do imóvel"),
    addressFull: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().min(2, "Cidade obrigatória"),
    type: z.string().default("Apartamento"),
    price: z.number().nonnegative(),
    commissionPct: z.number().min(0).max(100).default(2.5),
    notes: z.string().optional()
  }),
  saleValue: z.number().positive("Valor da venda obrigatório"),
  condicao: z.string().optional(),
  comprador: z.object({
    nome: z.string().min(3, "Nome do comprador obrigatório"),
    cpf: z.string().min(11, "CPF obrigatório"),
    rg: z.string().optional(),
    nascimento: z.string().nullable(),
    estadoCivil: z.string(),
    profissao: z.string().optional(),
    nacionalidade: z.string().optional(),
    email: z.string().nullable(),
    tel: z.string().min(10, "Telefone obrigatório"),
    endereco: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    uf: z.string().optional(),
    cep: z.string().optional()
  }),
  conjuge: z.object({
    nome: z.string().nullable(),
    cpf: z.string().nullable(),
    rg: z.string().nullable(),
    nascimento: z.string().nullable(),
    email: z.string().nullable(),
    tel: z.string().nullable()
  }),
  negociacao: z.object({
    tipo: z.string(),
    entrada: z.number().nonnegative(),
    financiado: z.number().nonnegative(),
    banco: z.string().nullable(),
    fgts: z.boolean(),
    prazoMeses: z.number().nullable(),
    dataVenda: z.string().nullable(),
    prevAssinatura: z.string().nullable(),
    obs: z.string().optional()
  })
});

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}

function maskName(full: string): string {
  const parts = full.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts[parts.length - 1]?.charAt(0) ?? "";
  return last ? `${first} ${last}.` : first;
}

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
      const fieldErrors: Record<string, string> = {};
      for (const issue of e.errors) {
        fieldErrors[issue.path.join(".") || "_form"] = issue.message;
      }
      return NextResponse.json(
        { error: "Validação falhou.", fieldErrors },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  // Encrypt sensitive data. Fails if DATA_ENCRYPTION_KEY missing.
  let phoneEncrypted: Buffer;
  let clientDataEncrypted: Buffer;
  try {
    const normalizedPhone = body.comprador.tel.replace(/\D/g, "");
    phoneEncrypted = encrypt(normalizedPhone);
    clientDataEncrypted = encrypt(
      JSON.stringify({
        comprador: body.comprador,
        conjuge: body.conjuge,
        condicao: body.condicao,
        negociacao: body.negociacao
      })
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Criptografia não configurada. Peça ao admin para definir DATA_ENCRYPTION_KEY (32 bytes base64) no Vercel."
      },
      { status: 503 }
    );
  }

  const phoneHash = sha256Hex(body.comprador.tel.replace(/\D/g, ""));
  const phoneMasked = maskPhone(body.comprador.tel);

  // Generate property code if not supplied
  const propertyCode =
    body.imovel.code && body.imovel.code.length >= 3
      ? body.imovel.code
      : `CAL-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const shouldSubmit = body.mode === "submit";

  const result = await db.$transaction(async (tx) => {
    // Reuse property by code if exists, else create
    let property = await tx.property.findUnique({ where: { code: propertyCode } });
    if (!property) {
      property = await tx.property.create({
        data: {
          code: propertyCode,
          title: body.imovel.title,
          description: body.imovel.notes || body.imovel.title,
          city: body.imovel.city,
          neighborhood: body.imovel.neighborhood || null,
          addressFull: body.imovel.addressFull || null,
          price: body.imovel.price,
          commissionPct: body.imovel.commissionPct,
          type: body.imovel.type,
          status: shouldSubmit ? "RESERVED" : "AVAILABLE"
        }
      });
    } else if (shouldSubmit && property.status === "AVAILABLE") {
      property = await tx.property.update({
        where: { id: property.id },
        data: { status: "RESERVED" }
      });
    }

    // Reuse lead by phoneHash if exists, else create
    let lead = await tx.lead.findFirst({ where: { phoneHash } });
    if (!lead) {
      lead = await tx.lead.create({
        data: {
          fullName: body.comprador.nome,
          maskedName: maskName(body.comprador.nome),
          phoneEncrypted,
          phoneMasked,
          phoneHash,
          email: body.comprador.email,
          source: "manual_sale",
          externalSource: "manual_sale",
          city: body.comprador.cidade || body.imovel.city,
          status: "PROPOSAL",
          assignedBrokerId: broker.id,
          assignedAt: new Date()
        }
      });
    } else if (lead.assignedBrokerId !== broker.id) {
      // Keep current assignment, but ensure this broker owns the proposal
      lead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          assignedBrokerId: broker.id,
          assignedAt: new Date(),
          status: "PROPOSAL"
        }
      });
    } else {
      lead = await tx.lead.update({
        where: { id: lead.id },
        data: { status: "PROPOSAL" }
      });
    }

    const sale = await tx.sale.create({
      data: {
        brokerId: broker.id,
        leadId: lead.id,
        propertyId: property.id,
        saleValue: body.saleValue,
        negotiationType: body.negociacao.tipo,
        clientDataEncrypted,
        notes: body.negociacao.obs || null,
        status: shouldSubmit ? "SUBMITTED" : "DRAFT",
        submittedAt: shouldSubmit ? new Date() : null
      },
      select: { id: true, status: true }
    });

    if (shouldSubmit) {
      await tx.legalCase.create({
        data: { saleId: sale.id, status: "RECEIVED" }
      });
    }

    await tx.auditEvent.create({
      data: {
        actorUserId: session.user.id as string,
        actorRole: session.user.role as string,
        action: shouldSubmit ? "SALE_SUBMITTED" : "SALE_DRAFT_SAVED",
        entityType: "Sale",
        entityId: sale.id,
        metadata: {
          leadId: lead.id,
          propertyId: property.id,
          saleValue: body.saleValue,
          negotiationType: body.negociacao.tipo
        },
        ipAddress,
        userAgent
      }
    });

    return { saleId: sale.id, status: sale.status };
  });

  return NextResponse.json({ id: result.saleId, status: result.status }, { status: 201 });
}
