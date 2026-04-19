import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Building,
  Building2,
  Car,
  ClipboardCheck,
  Headphones,
  Layers,
  LogIn,
  Lock,
  MapPin,
  Plane,
  Scale,
  ShieldCheck,
  Target,
  Zap
} from "lucide-react";
import { InstagramPhoneMockup } from "@/components/marketing/InstagramPhoneMockup";

const COMPANY = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Calebe Investimentos Imobiliários";
const LOGO = "https://d78txhfo8gp8r.cloudfront.net/calebe/arquivos/logo.png";

// Os 5 cards do bloco "Toda a estrutura para fechar sua venda"
const ESTRUTURA_CARDS = [
  { icon: Car, title: "Carro de luxo", body: "Frota executiva para receber o cliente" },
  { icon: Plane, title: "Avião disponível", body: "Traslado aéreo em atendimentos estratégicos" },
  { icon: Building2, title: "Apartamento alto padrão", body: "Hospedagem de apoio para o cliente" },
  { icon: Zap, title: "Velocidade na negociação", body: "Jurídico e back-office internos" },
  { icon: BadgeCheck, title: "Comissão garantida", body: "Processo contratual auditável" }
];

// 3 pilares da operação
const OPERACAO_PILARES = [
  {
    icon: Target,
    title: "Distribuição de oportunidades",
    body: "Oportunidades recebidas pela Calebe são alocadas conforme especialização, histórico e proximidade geográfica do afiliado."
  },
  {
    icon: ClipboardCheck,
    title: "Acompanhamento",
    body: "Cada atendimento é registrado em sistema próprio, com rastreabilidade do primeiro contato à assinatura do contrato."
  },
  {
    icon: Layers,
    title: "Padronização",
    body: "Procedimentos, métodos e protocolos de comunicação alinhados ao padrão Calebe em todas as etapas do atendimento."
  }
];

// 4 cards do diferencial
const DIFERENCIAL_CARDS = [
  {
    icon: Building,
    title: "Portfólio selecionado",
    body: "Unidades curadas junto a construtoras parceiras, com foco em regiões valorizadas do litoral catarinense."
  },
  {
    icon: Scale,
    title: "Apoio jurídico",
    body: "Equipe jurídica interna conduz análise, elaboração e acompanhamento contratual durante todo o processo de venda."
  },
  {
    icon: Headphones,
    title: "Suporte operacional",
    body: "Secretaria, reservas e back-office à disposição do afiliado — agendamentos, confirmações e apoio logístico quando aplicável ao atendimento."
  },
  {
    icon: ShieldCheck,
    title: "Processo auditável",
    body: "Plataforma própria com conversas registradas e rastreabilidade completa entre distribuição, atendimento e pagamento."
  }
];

// Processo 4 etapas
const PROCESSO_ETAPAS = [
  { n: "01", title: "Cadastro", body: "Preenchimento com dados profissionais, CRECI e documentação complementar." },
  { n: "02", title: "Análise", body: "Validação da documentação e avaliação de perfil pela equipe Calebe." },
  { n: "03", title: "Aprovação", body: "Liberação de acesso ao sistema, termo de adesão e orientações de onboarding." },
  { n: "04", title: "Atuação", body: "Recebimento de oportunidades, registro dos atendimentos e acompanhamento pelo sistema." }
];

// Posicionamento final
const POSICIONAMENTO = [
  {
    label: "Seleção",
    body: "Profissionais com CRECI ativo, postura corporativa e histórico compatível com o portfólio atendido pela Calebe."
  },
  {
    label: "Padrão",
    body: "Procedimentos documentados e métricas acompanhadas internamente para garantir consistência em cada atendimento."
  },
  {
    label: "Crescimento",
    body: "Expansão conduzida por demanda regional e absorção gradual de novos afiliados, sem metas de volume."
  }
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      {/* TOP BAR PÚBLICO — sticky */}
      <div
        id="publicTopBar"
        className="sticky top-0 z-40 border-b hairline"
        style={{ background: "rgba(4,16,31,.8)", backdropFilter: "blur(12px)" }}
      >
        <div className="container-site flex items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Image
                src={LOGO}
                alt="Calebe Imóveis"
                width={120}
                height={28}
                priority
                unoptimized
                className="logo-calebe"
              />
            </Link>
            <div className="hidden md:block w-px h-5 bg-app-border" />
            <span className="hidden md:inline text-[0.66rem] uppercase tracking-[0.14em] text-sand-100/60">
              Programa de Afiliados
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden lg:inline text-[0.65rem] uppercase tracking-[0.1em] text-sand-100/40">
              CRECI 6131J
            </span>
            <Link
              href="/login"
              data-cta="topbar_enter"
              className="inline-flex items-center gap-2 rounded-[2px] border border-gold-400/40 px-4 py-2 text-[0.7rem] uppercase tracking-[0.12em] font-medium text-gold-300 hover:border-gold-400/80 hover:bg-gold-400/[0.06] transition-colors"
            >
              <LogIn size={14} />
              Entrar no sistema
            </Link>
          </div>
        </div>
      </div>

      {/* =========================== HERO 2 COLUNAS =========================== */}
      <section className="relative">
        <div className="container-site pt-12 md:pt-20 pb-16 md:pb-24">
          <div className="grid lg:grid-cols-[auto_1fr] gap-10 lg:gap-14 xl:gap-20 items-center">
            {/* Coluna esquerda: phone Instagram */}
            <div className="order-2 lg:order-1 justify-self-center lg:justify-self-start">
              <InstagramPhoneMockup />
            </div>

            {/* Coluna direita: hero textual */}
            <div className="max-w-2xl order-1 lg:order-2">
              <div className="pill mb-6">
                <BadgeCheck size={14} />
                Programa Nacional Calebe · CRECI 6131J
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-[3.15rem] font-bold leading-[1.08] tracking-[-0.026em] text-sand-50">
                Uma estrutura profissional para corretores que atuam no mercado de{" "}
                <span className="text-gold-400">alto padrão</span>.
              </h1>
              <p className="mt-6 text-sand-100/75 text-base md:text-lg leading-relaxed">
                A Calebe Investimentos Imobiliários mantém um programa de corretores afiliados com portfólio selecionado, suporte operacional contínuo e processos padronizados. Operação voltada a profissionais com CRECI ativo e histórico consolidado.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <Link href="/cadastro" data-cta="hero_primary" className="btn-base btn-gold">
                  Solicitar participação
                  <ArrowRight size={14} />
                </Link>
                <Link href="/login" data-cta="hero_secondary" className="btn-base btn-outline">
                  Acessar área do afiliado
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.7rem] uppercase tracking-[0.14em] text-sand-100/45 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-gold-400/60" />
                  CRECI 6131J
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-gold-400/60" />
                  Litoral de Santa Catarina
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock size={14} className="text-gold-400/60" />
                  LGPD
                </span>
              </div>
            </div>
          </div>

          {/* ========== 5 CARDS ESTRUTURA DE APOIO ========== */}
          <div className="mt-14 md:mt-20">
            <p className="text-[0.72rem] uppercase tracking-[0.18em] font-semibold text-gold-400/80 mb-5 inline-flex items-center gap-3">
              <span className="w-8 h-px bg-gold-400/70" />
              Toda a estrutura para fechar sua venda
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              {ESTRUTURA_CARDS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="card p-5 md:p-6 hover:border-gold-400/40 transition-colors">
                  <div className="h-10 w-10 rounded-sm border border-gold-400/30 bg-gold-400/5 flex items-center justify-center text-gold-400 mb-4">
                    <Icon size={16} strokeWidth={1.5} />
                  </div>
                  <p className="text-sm md:text-[0.95rem] font-bold text-sand-50 leading-tight tracking-[-0.01em]">
                    {title}
                  </p>
                  <p className="text-xs text-sand-100/60 mt-1.5 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="divider-gold max-w-container mx-auto" />
      </section>

      {/* =========================== A OPERAÇÃO =========================== */}
      <section className="py-20 md:py-28">
        <div className="container-site">
          <div className="max-w-2xl mb-14">
            <p className="pill mb-5">A operação</p>
            <h2 className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold leading-[1.12] tracking-[-0.024em] text-sand-50">
              Como a Calebe conduz a rede de afiliados.
            </h2>
            <p className="mt-5 text-sand-100/70 leading-relaxed">
              Três princípios orientam o funcionamento do programa: distribuição planejada de oportunidades, acompanhamento rigoroso de cada atendimento e padronização das etapas críticas do processo.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 lg:gap-5">
            {OPERACAO_PILARES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="card p-7 md:p-8">
                <div className="h-11 w-11 rounded-sm border border-gold-400/30 bg-gold-400/5 flex items-center justify-center text-gold-400 mb-5">
                  <Icon size={16} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-sand-50 mb-3 tracking-[-0.015em]">{title}</h3>
                <p className="text-sm md:text-[0.95rem] text-sand-100/70 leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================== DIFERENCIAL — 4 CARDS =========================== */}
      <section className="py-20 md:py-28 border-t hairline">
        <div className="container-site">
          <div className="max-w-2xl mb-14">
            <p className="pill mb-5">O que é oferecido ao afiliado</p>
            <h2 className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold leading-[1.12] tracking-[-0.024em] text-sand-50">
              Estrutura completa para atender com o padrão da operação.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 lg:gap-5">
            {DIFERENCIAL_CARDS.map(({ icon: Icon, title, body }) => (
              <article key={title} className="card p-7 md:p-8 flex items-start gap-5">
                <div className="h-11 w-11 rounded-sm border border-gold-400/30 bg-gold-400/5 flex items-center justify-center text-gold-400 shrink-0">
                  <Icon size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-sand-50 mb-2 tracking-[-0.01em]">{title}</h3>
                  <p className="text-sand-100/70 leading-relaxed">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================== PROCESSO — 4 ETAPAS =========================== */}
      <section id="processo" className="py-20 md:py-28 border-t hairline">
        <div className="container-site">
          <div className="max-w-2xl mb-14">
            <p className="pill mb-5">Processo</p>
            <h2 className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold leading-[1.12] tracking-[-0.024em] text-sand-50">
              Da solicitação ao início da atuação.
            </h2>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-10">
            {PROCESSO_ETAPAS.map((s) => (
              <li key={s.n} className="relative pt-6 border-t hairline">
                <span className="absolute -top-px left-0 w-14 h-[2px] bg-gold-gradient" />
                <span className="text-gold-400 text-xs tracking-[0.16em] font-semibold uppercase">Etapa {s.n}</span>
                <h3 className="text-xl font-bold mt-3 mb-3 tracking-[-0.015em] text-sand-50">{s.title}</h3>
                <p className="text-sm text-sand-100/70 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* =========================== POSICIONAMENTO + CTA FINAL =========================== */}
      <section className="py-20 md:py-28 border-t hairline">
        <div className="container-site">
          <div className="max-w-3xl">
            <p className="pill mb-5">Posicionamento</p>
            <h2 className="text-3xl md:text-4xl lg:text-[2.6rem] font-bold leading-[1.1] tracking-[-0.024em] text-sand-50">
              Uma operação com <span className="text-gold-400">seleção criteriosa</span> e crescimento planejado.
            </h2>
            <div className="mt-12 grid md:grid-cols-3 gap-8 lg:gap-10">
              {POSICIONAMENTO.map((p) => (
                <div key={p.label}>
                  <p className="text-[0.72rem] uppercase tracking-[0.14em] font-semibold text-gold-400/80 mb-2">
                    {p.label}
                  </p>
                  <p className="text-sand-100/75 leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 pt-12 border-t hairline">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-sand-50 text-xl md:text-2xl font-bold tracking-[-0.018em]">
                  Interessado em integrar o programa?
                </p>
                <p className="mt-2 text-sand-100/65">
                  Análise conduzida pela equipe Calebe. Retorno em até 48 horas úteis.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link href="/cadastro" data-cta="final_primary" className="btn-base btn-gold">
                  Solicitar participação
                  <ArrowRight size={14} />
                </Link>
                <Link href="/login" data-cta="final_secondary" className="btn-base btn-outline">
                  Acessar área do afiliado
                </Link>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.7rem] uppercase tracking-[0.14em] text-sand-100/45 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-gold-400/60" />
                CRECI 6131J
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock size={14} className="text-gold-400/60" />
                Dados tratados conforme LGPD
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} className="text-gold-400/60" />
                Litoral de Santa Catarina
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================== FOOTER =========================== */}
      <div className="container-site py-10 border-t hairline mt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image
              src={LOGO}
              alt="Calebe"
              width={80}
              height={20}
              unoptimized
              className="logo-calebe sm opacity-60"
            />
            <span className="text-[0.65rem] uppercase tracking-[0.1em] text-sand-100/50">
              {COMPANY} · CRECI 6131J
            </span>
          </div>
          <span className="text-[0.65rem] uppercase tracking-[0.1em] text-sand-100/45">
            © {new Date().getFullYear()} · Itapema/SC
          </span>
        </div>
      </div>
    </main>
  );
}
