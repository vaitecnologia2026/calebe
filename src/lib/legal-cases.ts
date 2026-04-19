import { db } from "@/lib/db";
import type { LegalCaseCard } from "@/components/juridico/LegalKanban";

const ACTIVE_STATUSES = [
  "RECEIVED",
  "REVIEWING",
  "DOCS_PENDING",
  "DRAFTING",
  "READY_TO_SIGN"
] as const;

export async function loadActiveLegalCases(): Promise<LegalCaseCard[]> {
  const cases = await db.legalCase.findMany({
    where: { status: { in: [...ACTIVE_STATUSES] } },
    orderBy: { receivedAt: "asc" },
    include: {
      sale: {
        select: {
          id: true,
          saleValue: true,
          negotiationType: true,
          broker: { select: { user: { select: { name: true } } } },
          property: { select: { code: true, title: true } }
        }
      }
    }
  });

  return cases.map((c) => ({
    id: c.id,
    saleId: c.sale.id,
    status: c.status,
    legalNotes: c.legalNotes,
    receivedAt: c.receivedAt.toISOString(),
    brokerName: c.sale.broker.user.name,
    propertyCode: c.sale.property.code,
    propertyTitle: c.sale.property.title,
    saleValue: Number(c.sale.saleValue),
    negotiationType: c.sale.negotiationType
  }));
}

export async function loadFinalizedLegalCases() {
  const cases = await db.legalCase.findMany({
    where: { status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 200,
    include: {
      sale: {
        select: {
          id: true,
          saleValue: true,
          status: true,
          broker: { select: { user: { select: { name: true } } } },
          property: { select: { code: true, title: true } }
        }
      }
    }
  });
  return cases.map((c) => ({
    id: c.id,
    saleId: c.sale.id,
    propertyCode: c.sale.property.code,
    propertyTitle: c.sale.property.title,
    brokerName: c.sale.broker.user.name,
    saleValue: Number(c.sale.saleValue),
    saleStatus: c.sale.status,
    completedAt: c.completedAt ? c.completedAt.toISOString() : null,
    legalNotes: c.legalNotes
  }));
}
