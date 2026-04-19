# CRM Calebe Afiliados — Guia de Instalação e Configuração

Guia completo para instalar, configurar e publicar o CRM Calebe em ambiente de desenvolvimento e produção.

---

## 1 · Visão geral do projeto

**CRM Calebe Afiliados** é a plataforma operacional da Calebe Investimentos Imobiliários para gestão de corretores afiliados, leads, imóveis, vendas, estrutura premium (avião/carro/apartamento) e back-office jurídico.

**Dois entregáveis:**
- `01-crm-mvp/` — Aplicação real Next.js 14 + Prisma + NextAuth (produção)
- `demo-funcionalidades.html` — Protótipo visual single-file para demonstração e validação de fluxos

**Stack:**
- Next.js 14 (App Router · Server Components)
- PostgreSQL 14+ (Neon / Supabase / Vercel Postgres)
- Prisma ORM 5.x
- NextAuth v5 (JWT)
- Tailwind CSS
- Vercel Blob (upload de documentos)
- Pusher Channels (chat em tempo real — opcional no MVP)
- VAI API (WhatsApp — ver `DOCUMENTACAO_VAI_API.md`)

---

## 2 · Requisitos do ambiente

| Requisito | Versão mínima | Como instalar |
|---|---|---|
| **Node.js** | 20.x LTS | [nodejs.org](https://nodejs.org) ou `nvm install 20` |
| **npm** | 10.x | vem com Node |
| **PostgreSQL** | 14 | Neon/Supabase/Vercel recomendados (gerenciado) |
| **Git** | 2.x | `brew install git` / `apt install git` |
| **openssl** | qualquer | geralmente pré-instalado |

**Extensões Postgres necessárias** (aplicadas automaticamente pelas migrações):
- `pgcrypto` (para hashing / criptografia nativa)
- `citext` (para e-mails case-insensitive)

---

## 3 · Instalação passo a passo (dev local)

### 3.1 · Clonar e instalar dependências

```bash
cd /caminho/escolhido
# (Projeto já fornecido em ZIP — apenas descompacte)
unzip projeto-calebe-imoveis.zip
cd projeto-calebe-imoveis/01-crm-mvp

npm install
```

### 3.2 · Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Abra `.env.local` e preencha. **Campos obrigatórios para dev:**

```bash
# Banco local (ou Neon free tier)
DATABASE_URL="postgresql://user:pass@localhost:5432/crm_calebe?sslmode=prefer"
DIRECT_URL="postgresql://user:pass@localhost:5432/crm_calebe?sslmode=prefer"

# Auth (gerar com: openssl rand -base64 32)
AUTH_SECRET="cole_aqui_32_bytes_base64"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"

# Criptografia de dados sensíveis (gerar com: openssl rand -base64 32)
DATA_ENCRYPTION_KEY="cole_aqui_32_bytes_base64"

# Senha inicial dos 4 usuários oficiais
SEED_DEFAULT_PASSWORD="Calebe@2026!"
```

Os demais campos (VAI, Vercel Blob, Pusher, Tracking) podem ficar em branco no dev — os módulos que dependem deles degradam graciosamente.

### 3.3 · Banco de dados

**Opção A · Postgres local:**

```bash
# macOS com Homebrew
brew install postgresql@14
brew services start postgresql@14
createdb crm_calebe
```

**Opção B · Neon (recomendado · free tier):**

1. Acesse [neon.tech](https://neon.tech) → crie projeto
2. Copie `Connection String` (modo Pooled) → `DATABASE_URL`
3. Copie `Direct Connection` → `DIRECT_URL`

### 3.4 · Aplicar schema e seed

```bash
# Aplica migrações + gera Prisma Client
npm run db:deploy

# Popula usuários iniciais + dados mock para demo
npm run db:seed
```

**Usuários criados pelo seed (senha = `SEED_DEFAULT_PASSWORD`):**

| E-mail | Perfil | Redirecionamento após login |
|---|---|---|
| `adm@calebe.com.br` | ADMIN | `/app/admin` |
| `corretor@calebe.com.br` | BROKER | `/app/corretor` |
| `juridico@calebe.com.br` | LEGAL | `/app/juridico` |
| `secretaria@calebe.com.br` | SECRETARY | `/app/secretaria` |

### 3.5 · Rodar em dev

```bash
npm run dev
```

Abra http://localhost:3000 → clique em "Entrar no sistema" → use uma das credenciais acima.

---

## 4 · Visualizar o protótipo visual

O arquivo `demo-funcionalidades.html` é autocontido (Tailwind via CDN, sem build necessário):

**macOS:**
```bash
open projeto-calebe-imoveis/demo-funcionalidades.html
```

**Linux:**
```bash
xdg-open projeto-calebe-imoveis/demo-funcionalidades.html
```

**Ou sirva via HTTP simples** (recomendado para que o vídeo MP4 do hero carregue corretamente):

```bash
cd projeto-calebe-imoveis
npx serve -p 8080
# abra http://localhost:8080/demo-funcionalidades.html
```

---

## 5 · Build e publicação (produção)

### 5.1 · Build local

```bash
cd 01-crm-mvp
npm run build
npm run start
# abra http://localhost:3000
```

### 5.2 · Deploy na Vercel (recomendado)

1. Acesse [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Importe o repositório (ou use CLI: `npx vercel`)
3. Em **Root Directory**, aponte para `01-crm-mvp`
4. **Environment Variables** — copie TODAS as variáveis do `.env.local`:
   - `DATABASE_URL` e `DIRECT_URL`
   - `AUTH_SECRET` (gere NOVO para prod: `openssl rand -base64 32`)
   - `AUTH_URL` (seu domínio: `https://crm.calebeimoveis.com.br`)
   - `DATA_ENCRYPTION_KEY` (gere NOVO para prod)
   - `BLOB_READ_WRITE_TOKEN` (crie em Vercel → Storage → Blob)
   - `VAI_API_TOKEN`, `VAI_INSTANCE_ID`, `VAI_WEBHOOK_SECRET` (ver `DOCUMENTACAO_VAI_API.md`)
5. Clique em **Deploy**
6. Após deploy, rode migrações em produção:

```bash
# via CLI Vercel ou pelo painel (Logs → Functions)
npx prisma migrate deploy
npx prisma db seed
```

### 5.3 · Domínio customizado

Vercel → Project → **Settings** → **Domains** → adicione `crm.calebeimoveis.com.br` e siga as instruções de DNS.

Após propagar, atualize:
```bash
AUTH_URL="https://crm.calebeimoveis.com.br"
NEXT_PUBLIC_APP_URL="https://crm.calebeimoveis.com.br"
```
e faça redeploy.

---

## 6 · Configurando o banco de dados em produção

**Recomendado: Neon** (serverless Postgres, free tier generoso, excelente com Vercel):

1. [neon.tech](https://neon.tech) → New Project → região `sa-east-1` (São Paulo)
2. Conecte-se ao **branch `main`**
3. Copie as strings e coloque em Vercel:
   - **Pooled connection** → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL`
4. Após primeiro deploy, execute `prisma migrate deploy` + `prisma db seed` (ver 5.2)

**Backups:** Neon faz snapshot automático diário + point-in-time recovery 7 dias no free tier.

---

## 7 · Configuração de autenticação

Já vem configurada via NextAuth v5 (arquivo `src/auth.ts`):

- **Strategy:** JWT (sem sessões no DB → stateless, escalável)
- **Provider:** Credentials (e-mail/senha com bcrypt)
- **Proteção de rotas:** `middleware.ts` protege tudo em `/app/*`
- **Redirecionamento por role:** admin → `/app/admin`, broker → `/app/corretor`, etc.

**Para adicionar novos usuários em produção:**

```bash
# Via painel admin (recomendado)
Login como adm@calebe.com.br → Configurações → Criar novo usuário

# Ou via Prisma Studio
cd 01-crm-mvp
npx prisma studio
# Edite as tabelas User + Broker diretamente
```

**Trocar senha inicial:** após primeiro login, cada usuário deve ir em Meu Perfil → Alterar senha. A senha `SEED_DEFAULT_PASSWORD` **só funciona no primeiro login**.

---

## 8 · Integração com a API da VAI (WhatsApp)

Consulte o documento dedicado: **[DOCUMENTACAO_VAI_API.md](./DOCUMENTACAO_VAI_API.md)**

Resumo rápido:
1. Obtenha credenciais no painel VAI (`api.vaicrm.com.br`)
2. Preencha as 5 variáveis `VAI_*` no `.env` / Vercel
3. Cadastre webhook no painel VAI apontando para `https://seudominio.com/api/webhooks/vai`
4. Teste envio/recebimento com os scripts descritos na doc

---

## 9 · Configuração de webhooks

### 9.1 · Webhook de leads externos (ads, formulários de parceiros)

Endpoint: `POST /api/webhooks/leads`
Header esperado: `X-Webhook-Signature: sha256=<hmac_hex>`

```bash
# Gerar secret
openssl rand -hex 32  # → cole em WEBHOOK_LEADS_SECRET
```

Exemplo de chamada:

```bash
SECRET="$WEBHOOK_LEADS_SECRET"
BODY='{"source":"instagram","name":"João","phone":"+5547999888777","city":"Itapema","segmento":"Alto padrão"}'
SIG="sha256=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)"

curl -X POST https://seudominio.com/api/webhooks/leads \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIG" \
  -d "$BODY"
```

Resposta esperada:
```json
{ "accepted": true, "leadId": "clxxxx..." }
```

### 9.2 · Webhook VAI (inbound de mensagens)

Ver documento dedicado.

### 9.3 · Teste rápido com script incluso

```bash
cd 01-crm-mvp
npm run webhook:test
```

Valida: assinatura HMAC correta · payload schema · dedup por idempotency key.

---

## 10 · Testando o funcionamento completo

### 10.1 · Checklist básico

- [ ] `/api/health` retorna `200 OK` com `{ ok: true }`
- [ ] Login como ADMIN → dashboard carrega com KPIs
- [ ] Login como BROKER → dashboard corretor carrega
- [ ] Logout funciona em ambos
- [ ] Rota `/app/admin` bloqueia acesso anônimo (redireciona para `/login`)
- [ ] Rota `/app/juridico` acessada por BROKER redireciona para `/app/corretor`
- [ ] Webhook leads retorna 200 com assinatura válida, 401 com inválida
- [ ] Seed aplicou 4 usuários (query `SELECT email, role FROM "User"`)

### 10.2 · Fluxos críticos

| Fluxo | Quem | Passos |
|---|---|---|
| **Cadastro público** | Visitante | LP → Cadastrar corretor → form com CPF, CRECI, upload documento → submit → tela de sucesso |
| **Aprovação** | Admin | `/app/admin/aprovacao` → abrir ficha → validar CRECI → Aprovar → User criado com role BROKER |
| **Lead inbound** | Sistema | webhook `/api/webhooks/leads` → distribui para broker elegível → notifica via VAI |
| **Chat** | Corretor | `/app/corretor/conversas` → abrir conversa → enviar mensagem → VAI dispara para cliente |
| **Venda** | Corretor | Imóvel → Registrar venda → preenche 5 steps → Enviar ao jurídico → modal Parabéns |
| **Estrutura premium** | Corretor | Solicitar avião/carro/apto → Admin/Secretaria aprova → notificação VAI |

### 10.3 · Debug de produção

```bash
# Logs em tempo real (Vercel)
npx vercel logs --follow

# Conectar ao banco
npx prisma studio  # abre http://localhost:5555

# Queries diretas
psql $DATABASE_URL
```

---

## 11 · Principais cuidados na entrega

### Segurança

- **NUNCA** commitar `.env*` (já no `.gitignore`)
- **Gerar segredos novos** para produção (`AUTH_SECRET`, `DATA_ENCRYPTION_KEY`, `WEBHOOK_LEADS_SECRET`, `VAI_WEBHOOK_SECRET`) — nunca reutilizar os de dev
- **Trocar `SEED_DEFAULT_PASSWORD`** imediatamente após primeiro login
- **Revisar `User` table** antes de ir a produção — remova seed de dev se necessário
- **HTTPS obrigatório** em produção — Vercel já provê automaticamente

### Performance

- Índices Prisma já configurados em campos críticos (status, createdAt, fromUserId etc.)
- Vídeo da LP (`videos/hero-lp.mp4`) pode ser movido para Vercel Blob para redução de tamanho do bundle
- Habilitar **Edge Caching** na Vercel para rotas estáticas da LP

### LGPD e auditoria

- Telefones de leads são **criptografados** em repouso (AES-256-GCM com `DATA_ENCRYPTION_KEY`)
- **Mascaramento obrigatório** no UI do corretor — só libera após aprovação do admin via workflow de "Negociação em fechamento"
- **AuditEvent** grava todas as ações sensíveis (acesso a tel, aprovações, desativações)
- `WebhookInboundLog` mantém payload bruto de todos os webhooks por 90 dias para compliance

### Monitoramento

- Configure **Vercel Analytics** para métricas de produto (grátis no Pro)
- Configure **Sentry** (ou similar) para capturar erros 5xx
- Alerta crítico: falha em `/api/webhooks/vai` → pode indicar spoofing ou secret dessincronizado
- Alerta crítico: falha em `/api/webhooks/leads` → pode estar perdendo leads pagos

### Operação

- **Rotação de secrets** a cada 90 dias
- **Backup do banco** — Neon free tier faz diário; para produção crítica considerar plano pago com PITR mais longo
- **Monitor de quota VAI** — verificar plano contratado vs. volume de mensagens
- Variáveis `LEAD_QUOTA_*` definem cotas de distribuição — revisar conforme tamanho da rede de corretores

---

## 12 · Estrutura de pastas entregue

```
projeto-calebe-imoveis/
├── 01-crm-mvp/                    ← Aplicação Next.js (produção)
│   ├── prisma/
│   │   ├── schema.prisma          ← 27 models · relações completas
│   │   └── seed.ts                ← seed de usuários + dados demo
│   ├── src/
│   │   ├── app/                   ← App Router
│   │   │   ├── api/               ← endpoints REST + webhooks
│   │   │   ├── app/               ← dashboards por role (admin/corretor/juridico/secretaria)
│   │   │   ├── login/
│   │   │   └── page.tsx           ← landing page
│   │   ├── auth.ts, auth.config.ts ← NextAuth
│   │   ├── middleware.ts          ← proteção de rotas
│   │   ├── lib/
│   │   │   ├── vai/               ← integração WhatsApp
│   │   │   ├── crypto.ts          ← AES-256-GCM
│   │   │   ├── rbac.ts            ← controle de acesso
│   │   │   └── tracking.ts        ← GA4/Pixel/GTM
│   │   └── components/            ← AppShell, formulários, UI
│   ├── .env.example               ← template completo
│   └── package.json
│
├── demo-funcionalidades.html      ← Protótipo visual single-file (~10k linhas)
├── videos/hero-lp.mp4             ← Vídeo Instagram do hero
├── imagens/                       ← Assets da LP
├── 00-pesquisa/                   ← Pesquisa de marca e referências
│
├── INSTALACAO.md                  ← (este arquivo)
├── DOCUMENTACAO_VAI_API.md        ← Guia de integração VAI
└── README.md                      ← Visão geral
```

---

## 13 · Suporte e próximos passos

**Dúvidas técnicas:**
- Integração VAI → veja `DOCUMENTACAO_VAI_API.md`
- Variáveis de ambiente → `.env.example` tem comentários em cada linha
- Schema do banco → `npx prisma studio` visualiza e edita

**Roadmap sugerido pós-MVP:**
- Notificações push in-app (Pusher Channels já parcialmente configurado)
- Integração CRECI para validação automática
- Dashboard de BI (métricas agregadas)
- App mobile nativo (React Native reusando API)

---

**Versão:** MVP v1.0
**Data de entrega:** Abril/2026
**Cliente:** Calebe Investimentos Imobiliários (Itapema/SC)
**CRECI:** 6131J
