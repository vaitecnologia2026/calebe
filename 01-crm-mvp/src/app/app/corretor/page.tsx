import Link from "next/link";
import { Plane, Building2, Car, ArrowRight, Target, MessagesSquare, Calendar, TrendingUp } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";

const PREMIUM_RESOURCES = [
  {
    slug: "aviao",
    title: "Reservar Avião",
    subtitle: "Traslado aéreo para visitas estratégicas",
    icon: Plane,
    href: "/app/corretor/estrutura?tipo=aviao"
  },
  {
    slug: "apartamento",
    title: "Reservar Apartamento",
    subtitle: "Apoio e hospedagem durante atendimentos",
    icon: Building2,
    href: "/app/corretor/estrutura?tipo=apartamento"
  },
  {
    slug: "veiculo",
    title: "Reservar Veículo",
    subtitle: "Motorista ou carro para receber o cliente",
    icon: Car,
    href: "/app/corretor/estrutura?tipo=veiculo"
  }
];

export default async function CorretorDashboard() {
  const user = await requireRole(["BROKER", "ADMIN"]);

  return (
    <AppShell role="BROKER" userName={user.name}>
      <div className="space-y-10">
        <header>
          <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
            Sua operação
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em] text-sand-50">
            Olá, <span className="text-gold-400">{user.name.split(" ")[0]}</span>.
          </h1>
          <p className="mt-2 text-sand-100/65 max-w-xl">
            Sua plataforma premium Calebe. Acesse abaixo os recursos exclusivos da rede.
          </p>
        </header>

        {/* DESTAQUE PREMIUM — Estrutura exclusiva Calebe */}
        <section aria-labelledby="premium-resources">
          <div className="flex items-end justify-between mb-5">
            <h2
              id="premium-resources"
              className="text-xl md:text-2xl font-bold tracking-[-0.02em] text-sand-50"
            >
              Estrutura <span className="text-gold-400">exclusiva</span> Calebe
            </h2>
            <Link
              href="/app/corretor/estrutura"
              className="hidden md:inline-flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.12em] font-medium text-gold-300 hover:text-gold-200"
            >
              Ver histórico
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PREMIUM_RESOURCES.map(({ slug, title, subtitle, icon: Icon, href }) => (
              <Link
                key={slug}
                href={href}
                data-cta={`premium_${slug}`}
                className="group relative overflow-hidden rounded-[2px] bg-app-elevated border hairline p-6 md:p-7 transition-all duration-500 hover:border-gold-400/50 hover:bg-app-subtle"
              >
                <div
                  aria-hidden
                  className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gold-400/10 blur-3xl group-hover:bg-gold-400/20 transition-colors duration-700"
                />
                <div className="relative z-10">
                  <div className="h-14 w-14 rounded-[2px] border border-gold-400/30 bg-gold-400/5 flex items-center justify-center text-gold-400 mb-6 group-hover:border-gold-400/60 transition-colors">
                    <Icon size={26} strokeWidth={1.3} />
                  </div>
                  <h3 className="text-2xl md:text-[1.6rem] font-extrabold tracking-[-0.022em] text-sand-50 leading-tight mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-sand-100/60 mb-5 leading-relaxed">{subtitle}</p>
                  <span className="inline-flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-gold-300 group-hover:text-gold-200 transition-colors">
                    Solicitar
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* KPIs pessoais */}
        <section aria-labelledby="your-kpis">
          <h2 id="your-kpis" className="sr-only">Seus indicadores</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 tv:grid-cols-8 gap-3 lg:gap-4 tv:gap-5">
            {[
              { label: "Leads hoje", value: "3", hint: "Cota Ouro: 3/dia", icon: Target },
              { label: "Em conversa", value: "6", hint: "2 aguardam retorno", icon: MessagesSquare },
              { label: "Visitas agendadas", value: "5", hint: "Próxima amanhã 14h", icon: Calendar },
              { label: "Propostas ativas", value: "1", hint: "Apt. Meia Praia", icon: TrendingUp }
            ].map(({ label, value, hint, icon: Icon }) => (
              <div key={label} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[0.68rem] uppercase tracking-[0.14em] font-medium text-sand-100/55">
                    {label}
                  </p>
                  <Icon size={14} className="text-gold-400/60" strokeWidth={1.5} />
                </div>
                <p className="text-3xl font-bold tracking-[-0.032em] text-sand-50 leading-none">
                  {value}
                </p>
                <p className="mt-2 text-[0.72rem] text-gold-400/90">{hint}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Acesso rápido */}
        <section aria-labelledby="quick-links">
          <h2
            id="quick-links"
            className="text-xl font-bold tracking-[-0.02em] text-sand-50 mb-5"
          >
            Atalhos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Meus Leads", href: "/app/corretor/leads" },
              { label: "Conversas", href: "/app/corretor/conversas" },
              { label: "Imóveis", href: "/app/corretor/imoveis" },
              { label: "Agenda", href: "/app/corretor/agenda" }
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="card p-4 flex items-center justify-between hover:border-gold-400/40 transition-colors text-sm"
              >
                <span>{label}</span>
                <ArrowRight size={14} className="text-gold-400" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
