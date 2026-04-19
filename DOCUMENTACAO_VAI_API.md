# Integração com a API da VAI — Chat WhatsApp

Documento técnico único para conectar o CRM Calebe Afiliados à plataforma **VAI (vaicrm.com.br)** — responsável por envio, recebimento e sincronização de conversas WhatsApp com leads e corretores.

> **Referência oficial da VAI:** `https://api.vaicrm.com.br/docs#`
> Este documento cobre **onde configurar**, **o que configurar** e **como testar** dentro deste projeto. Os endpoints exatos da VAI devem ser validados na documentação oficial acima antes de ir para produção.

---

## 1 · Arquitetura resumida

```
┌──────────────┐                   ┌──────────────┐
│  VAI Platform│ ← envia mensagem→│   WhatsApp   │
│  (vaicrm...) │ ← recebe msgs ←──│   do cliente │
└──────┬───────┘                   └──────────────┘
       │
       │ (1) Inbound: cliente responde → VAI dispara webhook
       ▼
┌─────────────────────────────────────────────┐
│  CRM Calebe · Next.js                        │
│                                              │
│  POST /api/webhooks/vai   ← inbound VAI     │
│                                              │
│  src/lib/vai/               ← outbound VAI  │
│    ├─ client.ts  (HTTP client com Bearer)   │
│    ├─ types.ts   (VaiContact, VaiMessage)   │
│    └─ index.ts   (fachada: sendMessage, …)  │
└─────────────────────────────────────────────┘
       │
       │ (2) Outbound: corretor envia mensagem → CRM chama VAI
       ▼
 [WhatsApp Business Cloud via VAI]
```

---

## 2 · Credenciais necessárias (produção)

Crie uma conta operacional na VAI e obtenha:

| Credencial | Onde pegar | Uso |
|---|---|---|
| **API Token (Bearer)** | Painel VAI → **Integrações** → **API** | Autenticar chamadas outbound do CRM |
| **Instance ID** | Painel VAI → **Instâncias** → ID da linha WhatsApp da Calebe | Identifica a linha de origem das mensagens |
| **Número emissor** | Painel VAI → Instância → telefone oficial | Usado como `from` em envios |
| **Webhook Secret (HMAC)** | Painel VAI → **Webhooks** → Gerar Secret | Valida autenticidade dos webhooks recebidos |
| **URL do webhook** | Forneça à VAI: `https://seudominio.com/api/webhooks/vai` | Endpoint de entrada do CRM |

---

## 3 · Variáveis de ambiente

Adicione em `.env.local` (dev) ou no painel da Vercel (Project → Settings → Environment Variables):

```bash
# Endpoint base da VAI — normalmente não muda
VAI_API_BASE_URL="https://api.vaicrm.com.br"

# Token Bearer (obtido no painel VAI → Integrações)
VAI_API_TOKEN="SEU_TOKEN_AQUI"

# ID da instância WhatsApp autorizada
VAI_INSTANCE_ID="SEU_INSTANCE_ID"

# Número emissor (opcional, fallback para o da instância)
VAI_SENDER_PHONE="5547999999999"

# Secret HMAC compartilhado com o webhook da VAI
# Gere com: openssl rand -hex 32
VAI_WEBHOOK_SECRET="64_caracteres_hex"
```

> ⚠ `VAI_WEBHOOK_SECRET` **vazio ou ausente** desabilita o webhook (retorna `503 Service Unavailable`) — comportamento proposital para evitar processar eventos não autenticados.

---

## 4 · Onde o CRM usa a VAI

### 4.1 · Outbound (CRM → WhatsApp do cliente)

Arquivo-fachada: `src/lib/vai/index.ts`
HTTP client: `src/lib/vai/client.ts`

Funções expostas (placeholder para endpoints oficiais — ajustar paths conforme documentação da VAI):

| Função | Endpoint esperado | Quando é chamada |
|---|---|---|
| `vaiCreateContact(contact)` | `POST /v1/contacts` | Ao criar lead / cadastrar corretor |
| `vaiSendMessage(payload)` | `POST /v1/messages` | Corretor envia mensagem pelo chat do CRM |
| `vaiListConversations(q)` | `GET /v1/conversations` | Sincronização periódica / abertura do chat |
| `vaiGetConversation(id)` | `GET /v1/conversations/:id` | Abrir histórico de uma conversa |

**Exemplo de envio (chat do corretor):**

```typescript
import { vaiSendMessage } from "@/lib/vai";

await vaiSendMessage({
  conversationId: conv.vaiConversationId,
  instanceId: process.env.VAI_INSTANCE_ID!,
  to: lead.phoneE164,
  text: "Boa tarde! Conseguimos agendar a visita…"
});
```

O token é injetado automaticamente pelo `vaiFetch()` em `client.ts` (header `Authorization: Bearer ${VAI_API_TOKEN}`).

### 4.2 · Inbound (cliente responde → VAI → CRM)

Endpoint: `POST /api/webhooks/vai`
Arquivo: `src/app/api/webhooks/vai/route.ts`

Fluxo:

1. VAI envia `POST` com corpo JSON + header `x-vai-signature` (HMAC-SHA256)
2. CRM valida assinatura com `VAI_WEBHOOK_SECRET`
3. Body é gravado integralmente em `WebhookInboundLog` (auditoria append-only)
4. Evento é roteado conforme `event_type` (message.received, message.status, conversation.updated, etc.)
5. Conversa é atualizada + notificação enviada ao corretor responsável

---

## 5 · Configurando o webhook na VAI

No painel VAI (**Webhooks** → **Adicionar**):

| Campo | Valor |
|---|---|
| **URL** | `https://SEUDOMINIO.com/api/webhooks/vai` |
| **Método** | `POST` |
| **Secret** | igual ao `VAI_WEBHOOK_SECRET` do `.env` |
| **Header de assinatura** | `x-vai-signature` (ou `x-webhook-signature`) |
| **Eventos** | `message.received`, `message.status`, `conversation.updated` |
| **Retry** | Recomendado 3 tentativas com backoff |

Para **ambiente local** (dev), use um túnel HTTPS público:

```bash
# instale ngrok (https://ngrok.com/download)
ngrok http 3000
# copie a URL https://xxxx.ngrok-free.app e cadastre em VAI como webhook
```

---

## 6 · Validando envio e recebimento

### 6.1 · Teste de saída (CRM → VAI)

O projeto inclui um script de teste:

```bash
npm run webhook:test
```

Também é possível via `curl` contra sua própria instância local:

```bash
# Requer VAI_API_TOKEN no ambiente
curl -X POST "$VAI_API_BASE_URL/v1/messages" \
  -H "Authorization: Bearer $VAI_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"instanceId":"SEU_INSTANCE_ID","to":"5547999999999","text":"Teste Calebe"}'
```

Resultado esperado: `200 OK` com `{ messageId, status: "queued" }`.

### 6.2 · Teste de entrada (VAI → CRM)

Simular um webhook inbound:

```bash
SECRET="seu_webhook_secret"
BODY='{"event":"message.received","conversation_id":"abc","from":"5547888887777","text":"Olá"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

curl -X POST http://localhost:3000/api/webhooks/vai \
  -H "Content-Type: application/json" \
  -H "x-vai-signature: $SIG" \
  -d "$BODY"
```

Resultado esperado: `200 OK`. Verifique no banco:

```sql
SELECT id, status, event_type, created_at
FROM "WebhookInboundLog"
WHERE source = 'vai'
ORDER BY created_at DESC LIMIT 5;
```

---

## 7 · Como testar visualmente no CRM

### Fluxo completo de chat

1. **Login como corretor:** `corretor@calebe.com.br` / senha seed
2. **Aba Leads:** abra um lead com conversa ativa
3. **Clique em "Abrir chat"** → envie mensagem de teste
4. **No WhatsApp do cliente:** a mensagem deve chegar em até 3 segundos
5. **Resposta do cliente:** chega via webhook → aparece no chat do CRM sem refresh

### Fluxo de notificação ao jurídico / reservas

1. **Admin → Configurações** → preencha telefone do responsável jurídico/reservas + template
2. **Como corretor:** envie uma venda ao jurídico OU solicite estrutura premium
3. **Responsável recebe WhatsApp automaticamente** via VAI com os dados do template

---

## 8 · Boas práticas de operação

- **Não commitar** `.env.local` (já está no `.gitignore`)
- **Rotacionar** `VAI_API_TOKEN` e `VAI_WEBHOOK_SECRET` a cada 90 dias
- **Monitorar `WebhookInboundLog`** — eventos com `status="REJECTED"` indicam assinatura inválida (possível tentativa de spoofing ou secret dessincronizado)
- **Respeitar rate limits** da VAI — o `vaiFetch()` loga erros HTTP; implementar backoff exponencial se começar a receber `429`
- **Telefones sempre em E.164** (ex.: `5547999999999`, sem espaços/parênteses) antes de chamar a VAI
- **Mascaramento de telefone**: no UI do corretor o número real é sempre mascarado — liberação só após aprovação do admin (regra do CRM, não da VAI)

---

## 9 · Erros comuns e como resolver

| Erro / Sintoma | Causa provável | Solução |
|---|---|---|
| Webhook retorna `503 "VAI webhook desabilitado"` | `VAI_WEBHOOK_SECRET` não definido | Adicionar no `.env` e redeploy |
| Webhook retorna `401 "Assinatura inválida"` | Secret no CRM ≠ Secret na VAI | Sincronizar valor nos dois lados; verificar se há espaços extras |
| Envio outbound retorna `401` da VAI | Token expirado/inválido | Regenerar em painel VAI → atualizar `VAI_API_TOKEN` |
| Envio outbound retorna `404` | `instanceId` inválido ou não associado ao token | Conferir `VAI_INSTANCE_ID` em Painel VAI → Instâncias |
| Mensagem enviada mas não chega no cliente | Número não está em formato E.164 | Normalizar com `normalizePhone()` antes de enviar |
| Webhook chega mas conversa não aparece no CRM | `conversation_id` não batendo com `Conversation.vaiConversationId` | Verificar coluna `vai_conversation_id` na tabela; pode precisar criar a Conversation primeiro |
| Retentativas duplicadas criando mensagens repetidas | Falta de idempotência no handler | O CRM já faz dedup por hash do body em `WebhookInboundLog`; se persistir, verificar retry policy na VAI (máx 3) |

---

## 10 · Checklist de go-live

- [ ] `.env.local` populado com todas as 5 variáveis VAI
- [ ] Webhook cadastrado no painel VAI apontando para URL de produção
- [ ] Secret HMAC sincronizado entre VAI e CRM
- [ ] Teste outbound enviando mensagem de hello real
- [ ] Teste inbound respondendo no WhatsApp do cliente
- [ ] `WebhookInboundLog` registrando eventos com `status="PROCESSED"`
- [ ] Admin → Configurações → templates jurídico e reservas preenchidos
- [ ] Botão "Enviar teste" (em Admin → Configurações → Notificação Jurídico) retornou `200 OK`
- [ ] Rotação de secrets agendada (calendário/ops)
- [ ] Monitor de erros (Sentry/logs Vercel) configurado para alertas 5xx em `/api/webhooks/vai`

---

**Última atualização:** Abril/2026 · MVP v1.0
**Mantenedor:** Equipe Calebe Investimentos Imobiliários
