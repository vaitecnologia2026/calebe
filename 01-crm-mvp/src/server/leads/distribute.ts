import { db } from "@/lib/db";
import { BrokerCategory, LeadAssignmentEventType } from "@prisma/client";

/**
 * Aplica distribuição de um lead para o próximo corretor elegível.
 * Estratégia MVP: round-robin por categoria, respeitando cota diária.
 * Tiers priorizados: DIAMOND → GOLD → SILVER → BRONZE.
 *
 * Em caso de nenhum corretor disponível, lead fica sem `assignedBrokerId`
 * e entra na fila do admin (evento BLOCKED).
 */
const PRIORITY: BrokerCategory[] = [
  BrokerCategory.DIAMOND,
  BrokerCategory.GOLD,
  BrokerCategory.SILVER,
  BrokerCategory.BRONZE
];

export async function distributeLead(leadId: string): Promise<{ brokerId: string | null }> {
  const today = startOfTodayUTC();

  // Carrega regras atuais por categoria
  const rules = await db.leadDistributionRule.findMany({ where: { isActive: true } });
  const quotaBy: Record<BrokerCategory, number> = {
    BRONZE: 1,
    SILVER: 2,
    GOLD: 3,
    DIAMOND: 5
  };
  for (const r of rules) quotaBy[r.category] = r.leadsPerDay;

  for (const tier of PRIORITY) {
    // Busca corretores APPROVED dessa categoria, com aceite do termo
    const brokers = await db.broker.findMany({
      where: {
        category: tier,
        approvalStatus: "APPROVED",
        hasAcceptedTerm: true
      },
      select: {
        id: true,
        _count: {
          select: {
            distributions: {
              where: { distributionDate: today }
            }
          }
        }
      },
      orderBy: { updatedAt: "asc" } // quem foi menos atualizado recentemente
    });

    const quota = quotaBy[tier];
    // Filtra quem ainda tem cota
    const available = brokers.filter((b) => b._count.distributions < quota);
    if (available.length === 0) continue;

    // Ordena por menor consumo do dia, depois por menor atualização
    available.sort((a, b) => a._count.distributions - b._count.distributions);
    const chosen = available[0];

    await db.$transaction([
      db.leadDistribution.create({
        data: {
          brokerId: chosen.id,
          leadId,
          distributionDate: today
        }
      }),
      db.lead.update({
        where: { id: leadId },
        data: { assignedBrokerId: chosen.id, assignedAt: new Date(), status: "NEW" }
      }),
      db.leadAssignmentEvent.create({
        data: {
          leadId,
          brokerId: chosen.id,
          event: LeadAssignmentEventType.ASSIGNED,
          reason: `auto:${tier}`
        }
      })
    ]);

    return { brokerId: chosen.id };
  }

  // Nenhum disponível — vira fila do admin
  await db.leadAssignmentEvent.create({
    data: {
      leadId,
      brokerId: null,
      event: LeadAssignmentEventType.BLOCKED,
      reason: "no_broker_with_quota_available"
    }
  });
  return { brokerId: null };
}

function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
