import { PrismaClient, Role, BrokerCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

/** Quatro usuários oficiais do sistema (Padrão VAI + requisitos do cliente). */
const SEED_USERS: Array<{ email: string; role: Role; name: string }> = [
  { email: "adm@calebe.com.br",        role: Role.ADMIN,     name: "Administrador Calebe" },
  { email: "corretor@calebe.com.br",   role: Role.BROKER,    name: "Corretor Calebe" },
  { email: "juridico@calebe.com.br",   role: Role.LEGAL,     name: "Jurídico Calebe" },
  { email: "secretaria@calebe.com.br", role: Role.SECRETARY, name: "Secretaria Calebe" }
];

async function main() {
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD ?? "Calebe@2026!";
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  for (const u of SEED_USERS) {
    await db.user.upsert({
      where: { email: u.email },
      create: { email: u.email, passwordHash, name: u.name, role: u.role },
      update: { role: u.role, name: u.name }
    });
    console.log(`✓ usuário ${u.email} (${u.role})`);
  }

  // Se o corretor foi criado, garantir ficha Broker mínima
  const corretor = await db.user.findUnique({ where: { email: "corretor@calebe.com.br" } });
  if (corretor) {
    await db.broker.upsert({
      where: { userId: corretor.id },
      create: {
        userId: corretor.id,
        creci: "0000",
        creciState: "SC",
        city: "Itapema",
        category: BrokerCategory.GOLD,
        hasAcceptedTerm: false
      },
      update: {}
    });
  }

  // Regras de distribuição
  const rules: Array<[BrokerCategory, number]> = [
    [BrokerCategory.BRONZE, Number(process.env.LEAD_QUOTA_BRONZE ?? 1)],
    [BrokerCategory.SILVER, Number(process.env.LEAD_QUOTA_SILVER ?? 2)],
    [BrokerCategory.GOLD, Number(process.env.LEAD_QUOTA_GOLD ?? 3)],
    [BrokerCategory.DIAMOND, Number(process.env.LEAD_QUOTA_DIAMOND ?? 5)]
  ];
  for (const [category, leadsPerDay] of rules) {
    await db.leadDistributionRule.upsert({
      where: { category },
      create: { category, leadsPerDay },
      update: { leadsPerDay, isActive: true }
    });
  }

  // Termo v1.0.0
  await db.termVersion.upsert({
    where: { version: "1.0.0" },
    create: {
      version: "1.0.0",
      title: "Termo de Adesão do Corretor Afiliado Calebe",
      contentHtml: `
        <h2>Termo de Adesão — Corretor Afiliado Calebe</h2>
        <ol>
          <li>Os leads distribuídos pertencem operacionalmente à Calebe.</li>
          <li>Toda interação é registrada e auditada.</li>
          <li>É vedada a tentativa de obter o telefone real do cliente fora da plataforma.</li>
          <li>O corretor compromete-se a seguir o processo oficial.</li>
          <li>Violações implicam em desligamento imediato e responsabilização legal.</li>
        </ol>
      `.trim(),
      isCurrent: true
    },
    update: { isCurrent: true }
  });

  // Configurações iniciais
  const settings: Array<[string, unknown, string]> = [
    ["onboarding.welcome_video_url", process.env.NEXT_PUBLIC_ONBOARDING_VIDEO_URL ?? "", "URL do vídeo de boas-vindas no primeiro login."],
    ["broker.default_category", "BRONZE", "Categoria default para corretor recém-aprovado."],
    ["lead.distribution.algorithm", "round_robin_category", "Algoritmo de distribuição de leads."]
  ];
  for (const [key, value, description] of settings) {
    await db.systemSetting.upsert({
      where: { key },
      create: { key, value: value as never, description },
      update: {}
    });
  }

  console.log("\nSeed concluído.");
  console.log("Senha inicial para todos:", defaultPassword);
  console.log("TROQUE AS SENHAS NO PRIMEIRO LOGIN.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
