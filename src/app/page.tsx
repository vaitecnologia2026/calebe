import Link from "next/link";
import Image from "next/image";
import { Award, MapPin, Plane, ShieldCheck, Sparkles, TrendingUp, ArrowRight } from "lucide-react";

const COMPANY = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Calebe Investimentos Imobiliários";
const LOGO = "https://d78txhfo8gp8r.cloudfront.net/calebe/arquivos/logo.png";

const pillars = [
  {
    icon: TrendingUp,
    title: "Leads Qualificados",
    body: "Distribuição diária conforme sua categoria — Bronze, Prata, Ouro ou Diamante. Nenhum credenciado fica sem oportunidade."
  },
  {
    icon: Plane,
    title: "Estrutura Premium",
    body: "Avião, veículo, apartamento de apoio, visita acompanhada. Recursos mobilizados pela Calebe conforme disponibilidade."
  },
  {
    icon: ShieldCheck,
    title: "Processo Blindado",
    body: "Ferramenta própria, conversas dentro do sistema, rastreabilidade completa. Cada etapa é registrada e auditada."
  },
  {
    icon: Award,
    title: "Comissões Diferenciadas",
    body: "Portfólio com comissão padrão e imóveis especiais em condições diferenciadas. Acompanhamento em tempo real."
  }
];

const steps = [
  { n: "01", title: "Cadastre-se", body: "Preencha o formulário com CRECI, documentação e dados profissionais." },
  { n: "02", title: "Análise interna", body: "Nossa equipe valida o CRECI manualmente e avalia seu perfil." },
  { n: "03", title: "Onboarding", body: "Acesso liberado, vídeo de boas-vindas e termo de adesão digital." },
  { n: "04", title: "Atenda e venda", body: "Receba leads, agende visitas, registre vendas e acompanhe comissões." }
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      {/* HEADER — minimal */}
      <header className="relative z-20 border-b hairline">
        <div className="container-site flex items-center justify-between py-5 md:py-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={LOGO}
              alt="Calebe Imóveis"
              width={120}
              height={32}
              priority
              unoptimized
              className="h-7 md:h-8 w-auto invert brightness-[1.2]"
            />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-[4px] border border-gold-400/40 px-4 md:px-5 py-2 md:py-2.5 text-[0.72rem] md:text-[0.78rem] uppercase font-semibold tracking-[0.08em] text-gold-300 hover:border-gold-400/80 hover:bg-gold-400/8 transition-colors"
            data-cta="topbar_enter"
          >
            Entrar no sistema
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="container-site py-20 md:py-32 lg:py-40">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/5 px-4 py-1.5 mb-10">
              <Sparkles size={14} className="text-gold-400" />
              <span className="text-[0.68rem] uppercase font-semibold tracking-[0.16em] text-gold-300">
                Programa de Afiliados · CRECI 6131J
              </span>
            </div>

            <h1 className="text-[2.4rem] md:text-6xl lg:text-7xl font-extrabold leading-[1.02] tracking-[-0.034em] text-sand-50">
              A terra prometida
              <br className="hidden sm:block" /> do litoral catarinense,
              <br className="hidden sm:block" />{" "}
              <span className="text-gold-400">acessível a você.</span>
            </h1>

            <p className="mt-8 md:mt-10 text-base md:text-lg text-sand-100/70 max-w-2xl leading-relaxed">
              Junte-se ao programa de corretores credenciados da{" "}
              <strong className="text-sand-50 font-semibold">{COMPANY}</strong>. Portfólio
              curado em Meia Praia, Itapema, Porto Belo e Balneário Camboriú — com distribuição
              de leads, estrutura mobilizada e processos profissionais ao seu lado.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <Link href="/cadastro" data-cta="hero_primary" className="btn-gold">
                Cadastrar Corretor Afiliado
                <ArrowRight size={16} />
              </Link>
              <Link href="/login" data-cta="hero_secondary" className="btn-outline">
                Entrar no Sistema
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-sand-100/45 font-medium">
              <span className="inline-flex items-center gap-2">
                <MapPin size={13} className="text-gold-400/70" />
                Meia Praia
              </span>
              <span className="text-sand-100/25">·</span>
              <span>Itapema</span>
              <span className="text-sand-100/25">·</span>
              <span>Porto Belo</span>
              <span className="text-sand-100/25">·</span>
              <span>Balneário Camboriú</span>
            </div>
          </div>
        </div>
        <div className="divider-gold mx-auto max-w-container" />
      </section>

      {/* PILARES */}
      <section className="py-20 md:py-28">
        <div className="container-site">
          <div className="max-w-2xl mb-14">
            <p className="pill-section mb-5">Por que Calebe</p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-[-0.024em]">
              Uma plataforma construída para quem{" "}
              <span className="text-gold-400">produz resultado</span>.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-app-border">
            {pillars.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="bg-app-elevated p-8 md:p-10 hover:bg-app-subtle transition-colors duration-500 group"
              >
                <div className="h-12 w-12 rounded-[4px] border border-gold-400/30 bg-gold-400/5 flex items-center justify-center mb-6 group-hover:border-gold-400/60 transition-colors">
                  <Icon size={20} className="text-gold-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-sand-50 tracking-[-0.02em]">{title}</h3>
                <p className="text-sand-100/70 leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 md:py-28 border-t hairline">
        <div className="container-site">
          <div className="max-w-2xl mb-14">
            <p className="pill-section mb-5">Processo</p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-[-0.024em]">
              Do cadastro à primeira comissão em{" "}
              <span className="text-gold-400">poucos dias</span>.
            </h2>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-10">
            {steps.map((s) => (
              <li key={s.n} className="relative pt-6 border-t hairline">
                <span className="absolute -top-px left-0 w-16 h-[2px] bg-gold-gradient" />
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold-400">
                  Etapa {s.n}
                </span>
                <h3 className="text-2xl font-bold mt-3 mb-3 text-sand-50 tracking-[-0.02em]">
                  {s.title}
                </h3>
                <p className="text-sand-100/70 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 md:py-28 border-t hairline">
        <div className="container-site text-center max-w-3xl mx-auto">
          <p className="pill-section mb-5">Adesão</p>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-[-0.024em]">
            Pronto para operar com quem entende o{" "}
            <span className="text-gold-400">mercado catarinense</span>?
          </h2>
          <p className="mt-6 text-sand-100/70 leading-relaxed">
            Cadastro gratuito, avaliado manualmente pela equipe Calebe. CRECI ativo é requisito obrigatório.
          </p>
          <div className="mt-10">
            <Link href="/cadastro" data-cta="footer_cta" className="btn-gold">
              Cadastrar Corretor Afiliado
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t hairline py-10">
        <div className="container-site flex flex-col md:flex-row items-center justify-between gap-4 text-[0.7rem] uppercase font-medium tracking-[0.1em] text-sand-100/50">
          <div className="flex items-center gap-4">
            <Image
              src={LOGO}
              alt="Calebe"
              width={80}
              height={22}
              unoptimized
              className="h-5 w-auto invert brightness-[1.2] opacity-60"
            />
            <span>© {new Date().getFullYear()} · {COMPANY}</span>
          </div>
          <span>CRECI 6131J · Itapema/SC</span>
        </div>
      </footer>
    </main>
  );
}
