# CRM Calebe Afiliados — MVP

Plataforma web responsiva (PWA) para captação, aprovação e gestão de corretores afiliados da **Calebe Investimentos Imobiliários** (Itapema · Meia Praia · Porto Belo / SC).

> **Stack:** Next.js 14 · TypeScript · Prisma · PostgreSQL · Tailwind · NextAuth v5 · Vercel Blob · Pusher (preparado) · VAI WhatsApp (adapter preparado).

---

## Status atual da implementação

### ✅ Etapa 1 — Fundação
- Arquitetura de pastas, TypeScript estrito, ESLint, Tailwind com design tokens da marca Calebe
- Schema Prisma completo (**25 tabelas**, enums, índices, relações)
- Migration SQL de triggers Postgres para **auditoria imutável** (`audit_events` com UPDATE/DELETE bloqueados) + extensões `pgcrypto` e `citext`
- Seed inicial (admin, regras de distribuição, termo v1.0.0, settings)

### ✅ Etapa 3 — Landing Page + Cadastro
- LP pública premium (`/`) responsiva mobile-first
- Formulário de cadastro (`/cadastro`) com:
  - Validação de CPF (dígito verificador) e CRECI/UF via Zod
  - Máscaras (telefone, CPF) em tempo real
  - Upload de credencial CRECI para **Vercel Blob** (presigned direto)
  - Dedup por CPF, e-mail e CRECI
  - Registro de IP e User-Agent
- API `POST /api/broker-applications` (cria `BrokerApplication` + `AuditEvent`)
- Página de confirmação (`/cadastro/obrigado`)
- PWA manifest + theme color

### 🔜 Próximas etapas (não implementadas ainda)
Etapa 2 (Auth NextAuth) · Etapa 4 (Fila aprovação admin) · Etapa 5 (Vídeo+termo) · Etapa 6 (Dashboard) · Etapa 7 (Distribuição) · Etapa 8 (Chat sem telefone) · 9–15.

---

## Requisitos

- **Node.js 20+**
- **PostgreSQL 14+** (recomendado: [Neon](https://neon.tech) ou [Supabase](https://supabase.com) — ambos têm free tier e funcionam perfeitamente com Vercel)
- Conta [Vercel](https://vercel.com) (para deploy e Blob)
- Conta [Pusher](https://pusher.com) (para chat — pode ser pulada no primeiro sprint)

---

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local e preencha: DATABASE_URL, DIRECT_URL, AUTH_SECRET, DATA_ENCRYPTION_KEY

# 3. Criar schema no Postgres
npm run db:push

# 4. Rodar migration manual de triggers de auditoria
psql "$DATABASE_URL" -f prisma/migrations/0001_audit_triggers/migration.sql

# 5. Popular seed inicial (admin, regras, termo)
npm run db:seed

# 6. Dev server
npm run dev
# → http://localhost:3000
```

### Gerar secrets

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -base64 32   # DATA_ENCRYPTION_KEY
```

---

## Deploy na Vercel

1. Suba o repositório no GitHub (pasta `01-crm-mvp/` como root do projeto Vercel — ou mova para raiz)
2. **Import Project** no Vercel apontando para o repo
3. Configure **Environment Variables** copiando do `.env.example`
4. Crie o **Vercel Blob** em *Storage → Blob* e copie o token → `BLOB_READ_WRITE_TOKEN`
5. Provisione Postgres (Vercel Postgres, Neon ou Supabase) → copie `DATABASE_URL` e `DIRECT_URL`
6. Faça deploy. Após o primeiro build, rode as migrations:
   ```bash
   # Localmente apontando para o banco de produção:
   DATABASE_URL="postgresql://..." npm run db:deploy
   psql "$DATABASE_URL" -f prisma/migrations/0001_audit_triggers/migration.sql
   DATABASE_URL="postgresql://..." npm run db:seed
   ```

### Domínios
- LP pública + cadastro: `afiliados.calebeimoveis.com.br` (sugestão)
- Admin (futuro): `admin.calebeimoveis.com.br`
- Corretor (futuro): mesmo host, segmentado por rota + auth

---

## Estrutura do projeto

```
01-crm-mvp/
├── prisma/
│   ├── schema.prisma              # 25 tabelas + enums
│   ├── migrations/
│   │   └── 0001_audit_triggers/   # triggers Postgres de imutabilidade
│   └── seed.ts
├── public/
│   ├── manifest.webmanifest       # PWA
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Fontes, metadados, viewport
│   │   ├── globals.css            # Design tokens, utilitários
│   │   ├── page.tsx               # LP pública
│   │   ├── cadastro/
│   │   │   ├── page.tsx           # Formulário
│   │   │   └── obrigado/page.tsx  # Confirmação
│   │   └── api/
│   │       ├── health/route.ts
│   │       └── broker-applications/
│   │           ├── route.ts       # POST — criar application
│   │           └── upload/route.ts # POST — upload CRECI (Vercel Blob)
│   ├── components/
│   │   ├── ui/                    # Button, Input, Textarea, Select
│   │   └── marketing/
│   │       └── ApplicationForm.tsx
│   └── lib/
│       ├── db.ts                  # Prisma singleton
│       ├── cn.ts                  # Tailwind merge util
│       └── validators.ts          # Zod schemas + CPF validator
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## Princípios arquiteturais não-negociáveis

1. **Lead pertence à Calebe** — telefone do lead é **criptografado** (coluna `phoneEncrypted` via pgcrypto) e **nunca serializado** em APIs acessíveis ao corretor. Corretor enxerga apenas `phoneMasked` (`(47) 9****-**34`).
2. **Auditoria imutável** — tabela `AuditEvent` tem triggers Postgres que fazem `RAISE EXCEPTION` em qualquer UPDATE/DELETE. Todo evento relevante grava ali.
3. **Stateless 100%** — nada de filesystem, SQLite ou sessions server-side. Uploads vão para Vercel Blob. Chat em tempo real via Pusher (abstraído atrás de `NotificationProvider`).
4. **RBAC centralizado** — middleware único decide acesso por rota e papel. Testes E2E de elevação de privilégio são requisito P0 antes de produção.
5. **LGPD by design** — `legalBasis` gravado em cada lead; política de retenção documentada; endpoint de exclusão previsto para Fase 2.

---

## Autenticação & Perfis

**4 usuários oficiais criados pelo seed:**

| E-mail | Perfil | Pode ver |
|---|---|---|
| `adm@calebe.com.br` | ADMIN | Tudo |
| `corretor@calebe.com.br` | BROKER | Painel corretor (leads próprios, conversa, estrutura, visitas, vendas) |
| `juridico@calebe.com.br` | LEGAL | Fila jurídica, contratos, documentação |
| `secretaria@calebe.com.br` | SECRETARY | Solicitações de estrutura, agenda, confirmação de visitas |

**Senha inicial** (todos): valor de `SEED_DEFAULT_PASSWORD` no `.env` (default `Calebe@2026!`).
**Após primeiro login, troque imediatamente.**

### Rotas protegidas
- `/app` → redireciona automaticamente para o painel do perfil
- `/app/admin/*` → apenas ADMIN
- `/app/corretor/*` → BROKER (ADMIN tem view-only)
- `/app/juridico/*` → LEGAL (ADMIN também)
- `/app/secretaria/*` → SECRETARY (ADMIN também)

O [middleware.ts](middleware.ts) valida cada requisição pelo prefixo. URL direto sem sessão → redirect `/login?callbackUrl=<original>`.

---

## Webhook de Leads (inbound de campanhas, formulários, parceiros)

**Endpoint:** `POST /api/webhooks/leads`

**Autenticação:** HMAC-SHA256. O header `X-Webhook-Signature` deve conter o hex do HMAC do body usando `WEBHOOK_LEADS_SECRET`.

**Fluxo:**
1. Recebe payload → valida HMAC → 401 se inválido (log em `WebhookInboundLog` como `REJECTED`)
2. Gera `idempotencyKey = sha256(source::external_id|phone)` — dedup automática
3. Salva raw em `WebhookInboundLog` com status `RECEIVED` → `PROCESSING`
4. Normaliza → cria `Lead` com telefone criptografado (AES-256-GCM)
5. Roda [`distributeLead()`](src/server/leads/distribute.ts): round-robin por categoria (DIAMOND → GOLD → SILVER → BRONZE), respeitando cota diária
6. Cria `LeadAssignmentEvent` (ASSIGNED ou BLOCKED)
7. `WebhookInboundLog.status = PROCESSED` + `AuditEvent`

**Exemplo curl:**
```bash
BODY='{"source":"meta_ads","name":"Maria Silva","phone":"47999990000","email":"m@x.com","campaign":"apto_meia_praia","utm_source":"facebook"}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_LEADS_SECRET" | awk '{print $2}')
curl -X POST https://seusite.com/api/webhooks/leads \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIG" \
  -d "$BODY"
```

**Resposta:**
```json
{ "accepted": true, "leadId": "clx...", "assignedBrokerId": "clx...", "queued": false }
```

---

## Integração VAI API

**Documentação oficial:** https://api.vaicrm.com.br/docs#

**Arquivos:**
- [`src/lib/vai/client.ts`](src/lib/vai/client.ts) — HTTP client com bearer token, retry e error handling
- [`src/lib/vai/types.ts`](src/lib/vai/types.ts) — tipos espelhados (Contact, Conversation, Message, WebhookEvent)
- [`src/lib/vai/index.ts`](src/lib/vai/index.ts) — fachada `vai.contacts.*`, `vai.conversations.*`, `vai.messages.*`, `vai.webhooks.parseEvent`
- [`src/app/api/webhooks/vai/route.ts`](src/app/api/webhooks/vai/route.ts) — receiver de eventos inbound (mensagens recebidas)

**Config:**
```env
VAI_API_BASE_URL="https://api.vaicrm.com.br"
VAI_API_TOKEN="sua_api_key"
VAI_INSTANCE_ID="id_da_instancia"
VAI_WEBHOOK_SECRET="para_validar_webhooks_inbound"
VAI_SENDER_PHONE="(47) 9....-...."
```

**Os paths HTTP (`/v1/contacts`, etc.) são PLACEHOLDERS.** Quando obtiver a documentação oficial da VAI, ajuste **apenas** os endpoints em [`src/lib/vai/index.ts`](src/lib/vai/index.ts) — o resto do sistema consome a fachada e não precisa mudar.

**Fluxo de conversa:**
- Corretor envia mensagem → `POST /api/conversations/[id]/messages` → `vai.messages.sendText({...})` → salva `Message` local com `externalMessageId`
- VAI recebe mensagem do lead → POST em `/api/webhooks/vai` (HMAC) → `vai.webhooks.parseEvent()` → `Message` inserida com `direction=IN`
- Corretor **nunca** vê telefone real — APIs filtram campo antes de serializar

---

## Próximos passos imediatos

Ordem recomendada para continuar:

1. **Auth (Etapa 2)** — `NextAuth v5` com Credentials + Prisma Adapter, páginas de login segmentadas por perfil, middleware RBAC
2. **Admin — Fila de aprovação (Etapa 4)** — listagem + ficha detalhada + botões Aprovar/Negar + registro de CRECI manual
3. **Onboarding do corretor (Etapa 5)** — vídeo + termo + aceite transacional
4. **Dashboard admin (Etapa 6)** — KPIs executivos
5. Distribuição diária de leads via **Vercel Cron**
6. Chat com lead (telefone mascarado) via **Pusher**
7. Estrutura premium, visitas, vendas, jurídico, financeiro, logs

---

## Decisões pendentes do cliente

Antes de avançar para Etapa 2, confirmar:

- [ ] Provedor Postgres final (Neon, Supabase ou Vercel Postgres?)
- [ ] Domínio(s) a serem utilizados
- [ ] Conta Pusher ou preferência por polling inicial
- [ ] URL do vídeo de boas-vindas (quando disponível)
- [ ] Dados de sandbox da **API da VAI** (endpoint, token, número remetente)
- [ ] Identidade visual final (logo em SVG, ícones PWA nas resoluções 192 e 512)

---

© Calebe Investimentos Imobiliários — Todos os direitos reservados.
