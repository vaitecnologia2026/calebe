# Calebe Imóveis — Design System v1.0

Documento único de tokens, componentes e padrões. **Esta é a fonte-de-verdade.** Mudanças de marca passam por aqui primeiro, depois descem para o código.

**Última revisão:** abril/2026 (Design System Architect + UX Designer)

---

## 1. Princípios

1. **Plataforma premium bem resolvida**, não editorial clássico. Sem italics decorativos em headlines. Sem pesos `light` em display.
2. **Uma família tipográfica** (Plus Jakarta Sans) cobre tudo. Sem mixes de serif/mono.
3. **Dark-first.** A interface operacional do produto é dark. O site público segue a mesma paleta.
4. **Gold é acento, não preenchimento.** Usado em detalhes, bordas, destaques. Nunca em background de tela inteira.
5. **Sem emojis.** Todo glyph é SVG Lucide (`stroke-width: 1.5`, `currentColor`).
6. **Responsivo em 4 faixas:** mobile, tablet, desktop, **TV (1920px+)**.

---

## 2. Tokens

### 2.1 Cores — camada global (primitivas)

Implementadas em [tailwind.config.ts](../tailwind.config.ts).

| Token | Hex | Uso |
|---|---|---|
| `navy-950` | `#04101F` | Background base absoluto |
| `navy-900` | `#081A2E` | Gradiente de topo |
| `navy-800` | `#0E2A47` | Surfaces escuras |
| `navy-700` | `#16314F` | Variações de navy |
| `navy-500` | `#2C5680` | Primary mid |
| `gold-500` | `#B58E3E` | Gold escuro |
| `gold-400` | `#C9A961` | **Gold principal** (ícones, highlights, bordas de destaque) |
| `gold-300` | `#DEB96D` | Gold claro (hover text) |
| `sand-100` | `#F5EFE4` | Texto auxiliar (com transparência) |
| `sand-50`  | `#FBF9F4` | Foreground principal (texto body) |
| `success`  | `#0F7B5C` | Confirmações positivas |
| `danger`   | `#B83232` | Erros de validação |

### 2.2 Cores — camada de aplicação (semântica)

Definidas via classe `app.*` em Tailwind.

| Token | Hex | Uso |
|---|---|---|
| `app-bg` | `#0B0E13` | Background da aplicação logada |
| `app-elevated` | `#131720` | Cards, modais |
| `app-subtle` | `#161B25` | Inputs, áreas aninhadas |
| `app-border` | `#232A37` | Bordas 1px padrão (`hairline`) |
| `app-border-strong` | `#2F3848` | Bordas destacadas |

### 2.3 Tipografia

**Família única:** Plus Jakarta Sans (via `next/font/google` + variable `--font-sans`).

**Escala de tipo (mobile-first):**

| Role | Mobile | Desktop | Weight | Tracking | Line-height |
|---|---|---|---|---|---|
| `h1` hero | `2.4rem` | `4-5rem` | `800` | `-0.034em` | `1.02` |
| `h1` página | `1.875rem` (3xl) | `2.25rem` (4xl) | `700` | `-0.028em` | `1.08` |
| `h2` section | `1.875rem` (3xl) | `3rem` (5xl) | `700` | `-0.024em` | `1.1` |
| `h3` card | `1.5rem` (2xl) | `1.5rem` | `700` | `-0.02em` | `1.2` |
| `h4` meta | `1.25rem` (xl) | `1.25rem` | `700` | `-0.02em` | `1.3` |
| KPI value | `2.4rem` | `2.75rem` (em TV) | `700` | `-0.032em` | `1` |
| body | `1rem` | `1.125rem` (em TV) | `400` | `0` | `1.6` |
| body-small | `0.875rem` (sm) | — | `400` | `0` | `1.5` |
| button | `0.86rem` | — | `600-700` | `0.02-0.04em` | `1` |
| label / pill | `0.68-0.72rem` | — | `500-600` | `0.14-0.18em`, uppercase | `1.2` |
| eyebrow | `0.7rem` | — | `600` | `0.16-0.2em`, uppercase | `1` |

**Regras de uso:**
- Headlines em `<h1>`-`<h4>` recebem weight 700 automaticamente via `globals.css`. Para forçar weight 800, adicionar `font-extrabold`. Para weight 400 (raro), adicionar `font-normal`.
- KPI values (em `<p>`) exigem `font-bold` ou `font-extrabold` explícito porque `<p>` não recebe o weight de `h1..h4`.
- **Nunca** usar `italic` em headlines. Destaque de palavra = `<span className="text-gold-400">palavra</span>` sem italic.
- **Nunca** usar `font-light` — Jakarta em weight <400 perde legibilidade em retina.
- `letter-spacing` negativo é proporcional ao tamanho (headlines maiores = tracking mais negativo).

### 2.4 Espaçamento

Segue a escala padrão do Tailwind (`4px` base). Padrões canônicos:

| Contexto | Token | Valor |
|---|---|---|
| Padding interno de card | `p-5` a `p-7` | `20-28px` |
| Padding interno de modal grande | `p-6 md:p-10 lg:p-12` | `24-48px` |
| Gap entre cards em grid | `gap-3` a `gap-4` | `12-16px` |
| Gap entre seções | `py-20 md:py-28` | `80-112px` |
| Margem após eyebrow | `mb-3` a `mb-5` | `12-20px` |
| Margem após headline | `mt-6` a `mt-8` | `24-32px` |
| Margem antes de CTA | `mt-10` | `40px` |

### 2.5 Bordas & Radius

- `rounded-[4px]` é o radius padrão para cards, botões e inputs. Radius maior (`6px`) apenas para modais grandes.
- `rounded-full` para pills e avatares.
- Borda padrão: `1px solid app-border` via utility `hairline`.
- Borda destacada: `hairline-strong` (uso raro).

### 2.6 Shadows

| Token | Uso |
|---|---|
| `shadow-elev-1` | Elementos sutis (badge elevado) |
| `shadow-elev-2` | Cards em hover |
| `shadow-elev-3` | Modais, popovers |
| `shadow-gold-glow` | Botão gold primário |

### 2.7 Breakpoints (Padrão VAI)

Definidos em [tailwind.config.ts](../tailwind.config.ts).

| Nome | Min-width | Uso |
|---|---|---|
| `sm` | 640px | Landscape mobile, tablets pequenos |
| `md` | 768px | Tablet, mobile grande |
| `lg` | 1024px | Desktop pequeno |
| `xl` | 1280px | Desktop padrão |
| `2xl` | 1536px | Desktop grande |
| **`tv`** | **1920px** | **TV / 4K** (exclusivo Padrão VAI) |

---

## 3. Componentes

### 3.1 Button

**Variantes:** `gold` (primário), `outline` (secundário), `navy` (raro), `ghost` (nav).

**Props (Next.js):** `variant`, `fullWidth`, todos os props HTML de `<button>`.

**Estados:** default, hover (y-1px, shadow-elev-3), active, focus-visible (ring-gold-400), disabled (opacity-50).

**Acessibilidade:** tamanho mínimo 44x44px, focus ring de 2px, contraste 4.5:1+ em body.

**Uso:**
```tsx
<Button variant="gold">Cadastrar Corretor Afiliado</Button>
<Button variant="outline">Entrar no Sistema</Button>
```

### 3.2 Input / Textarea / Select

**Props:** `label`, `hint`, `error`, todos props HTML.

**Estados:** default, focus (border gold-400/70 + bg app-subtle), error (border danger/60), disabled.

**Acessibilidade:** `label` associada via `htmlFor`, `aria-invalid` em erro, mensagem de erro com `aria-describedby`.

### 3.3 Card

Classe utility `card` (em `globals.css`). Padrões:
- Padding interno `p-5` ou `p-6`
- Hover sutil: `border-gold-400/20`
- Para cards clicáveis, envolver em `<Link>` ou `<button>` — **não** anexar `onClick` ao `<div className="card">`.

### 3.4 Pill

Duas variantes:
- `pill` — chip navegável com fundo gold/10 e borda gold/30
- `pill-section` — eyebrow de seção, só texto uppercase com tracking largo

### 3.5 Modal (padrão Calebe)

**Estrutura:**
- Backdrop fixed inset-0 com `bg-navy-950/80 backdrop-blur-md`
- Card centralizado com `max-w-3xl` (cadastro) ou `max-w-md` (login)
- Botão X top-right em `h-10 w-10`
- Mobile: full-screen (rounded-none, sem margin)
- Desktop: rounded-[6px] com margin

**Dois-estados:** para fluxos com sucesso (cadastro), manter `form-state` e `success-state` no mesmo modal em vez de navegar para página separada.

---

## 4. Padrões de Layout

### 4.1 Tela pública (LP)

- **Topbar minimal:** logo + 1 botão ("Entrar no sistema")
- **Hero:** eyebrow + headline 7xl + body + 2 CTAs + localização
- **Seções:** pilares em 2x2, processo em 4 colunas, CTA final centralizado
- **Footer:** 2 colunas institucionais

### 4.2 Tela logada (`/app/*`)

- **Sidebar desktop:** largura fixa 240px, fundo `app-elevated/40`, logo no topo, nav vertical, usuário + logout no rodapé
- **Topbar mobile:** sticky, logo à esquerda, logout à direita
- **Bottom tabs (só BROKER mobile):** 5 itens principais
- **Main content:** `p-5 md:p-10`, max-width `container`

### 4.3 Fluxo de cadastro (nova regra abril/2026)

**Fluxo correto:**
1. LP com botão "Cadastrar Corretor Afiliado"
2. Clique abre **modal grande centralizado** ou navega para `/cadastro` (ambos apresentam a mesma interface — redundância proposital para compartilhamento de URL)
3. Título do bloco: **"Solicite sua adesão ao programa."**
4. Submit → troca para estado success dentro do mesmo container
5. Estado success: ícone check dourado + "Cadastro recebido." + mensagem + botão "Voltar à página inicial"

**ANTIPADRÃO (banido):** tabs/abas horizontais expondo "Landing Page / Cadastro / Agradecimento". Isso é resquício de protótipo e destrói o posicionamento premium.

---

## 5. Regras para Agentes/Devs

- **Ao criar nova página:** não adicionar `font-display` redundantemente — a família é única (Plus Jakarta Sans em `--font-sans`). Use `<h1>`/`<h2>` tags naturais para herdar weight 700 de `globals.css`.
- **Ao destacar palavra em headline:** `<span className="text-gold-400">palavra</span>`. **Nunca** `italic`.
- **Ao criar modal:** seguir o padrão 3.5 (backdrop + card + 2 estados se fluxo com sucesso).
- **Ao adicionar ícone:** `<Icon />` de `lucide-react` (Next.js) ou `<i data-lucide="nome" class="icon">` (HTML puro). **Nunca** emoji.
- **Ao publicar em nova tela:** verificar contraste em gold-400 sobre navy-950 (ratio ≥ 4.5:1 confirmado).
- **Ao usar Padrão VAI:** adicionar `data-cta="label_descritivo"` em CTAs principais para trackeamento automático.

---

## 6. Histórico de Decisões de Tipografia

| Data | De | Para | Motivo |
|---|---|---|---|
| Mar/2026 | — | Fraunces + Geist + Geist Mono | Extraído do Brand Manual v1.0 |
| Abr/2026 | Fraunces + Geist + Geist Mono | Instrument Serif + Inter | UI muito "dashboard de dev", Fraunces expressiva demais |
| Abr/2026 | Instrument Serif + Inter | **Plus Jakarta Sans (single)** | "Editorial clássico demais", cliente pediu "plataforma premium tecnológica"; Inter genérica demais |

**Escolha final Plus Jakarta Sans** (vs. alternativas Manrope e Sora):
- Manrope: neutro demais, cara de fintech genérica
- Sora: tech frio, inadequado para imobiliário premium
- **Plus Jakarta Sans: humanista moderna com warmth, usada por Pinterest, Duolingo, várias proptechs premium**. Em weights altos (700-800) funciona como display; em weight 400 lê bem como body. Uma família só = menos requests + mais consistência.

---

## 7. Checklist antes de subir feature nova

- [ ] Sem emojis? (SVG Lucide em todos os glifos)
- [ ] Sem `italic` em headlines?
- [ ] Sem `font-light`?
- [ ] Headlines com weight explícito (`font-bold` ou `font-extrabold`)?
- [ ] Inputs com `label` associado?
- [ ] Contraste mínimo 4.5:1 em texto?
- [ ] Focus ring visível com teclado?
- [ ] Funciona em 375px (mobile pequeno)?
- [ ] Funciona em 1920px (TV, breakpoint `tv`)?
- [ ] CTA principal com `data-cta`?
- [ ] Telefone do lead nunca serializado em response do corretor?
- [ ] Auditoria (`AuditEvent`) disparada em ação sensível?

---

**Responsáveis:** Design System Architect · UX Designer · Design Chief
**Review:** QA (AIOX) antes de publicação
