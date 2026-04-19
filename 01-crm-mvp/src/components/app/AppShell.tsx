import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { signOut } from "@/auth";
import type { Role } from "@prisma/client";

const LOGO = "https://d78txhfo8gp8r.cloudfront.net/calebe/arquivos/logo.png";

const NAV: Record<Role, Array<{ label: string; href: string }>> = {
  ADMIN: [
    { label: "Dashboard", href: "/app/admin" },
    { label: "Aprovação", href: "/app/admin/aprovacao" },
    { label: "Corretores", href: "/app/admin/corretores" },
    { label: "Leads", href: "/app/admin/leads" },
    { label: "Histórico de Leads", href: "/app/admin/leads/historico" },
    { label: "Imóveis", href: "/app/admin/imoveis" },
    { label: "Estrutura", href: "/app/admin/estrutura" },
    { label: "Visitas", href: "/app/admin/visitas" },
    { label: "Vendas", href: "/app/admin/vendas" },
    { label: "Jurídico", href: "/app/admin/juridico" },
    { label: "Financeiro", href: "/app/admin/financeiro" },
    { label: "Auditoria", href: "/app/admin/auditoria" },
    { label: "Configurações", href: "/app/admin/configuracoes" }
  ],
  BROKER: [
    { label: "Início", href: "/app/corretor" },
    { label: "Leads", href: "/app/corretor/leads" },
    { label: "Conversas", href: "/app/corretor/conversas" },
    { label: "Imóveis", href: "/app/corretor/imoveis" },
    { label: "Estrutura", href: "/app/corretor/estrutura" },
    { label: "Agenda", href: "/app/corretor/agenda" },
    { label: "Vendas", href: "/app/corretor/vendas" },
    { label: "Jurídico", href: "/app/corretor/juridico" },
    { label: "Financeiro", href: "/app/corretor/financeiro" }
  ],
  LEGAL: [
    { label: "Fila", href: "/app/juridico" },
    { label: "Contratos", href: "/app/juridico/contratos" }
  ],
  SECRETARY: [
    { label: "Dashboard", href: "/app/secretaria" },
    { label: "Solicitações", href: "/app/secretaria/estrutura" },
    { label: "Agenda", href: "/app/secretaria/visitas" }
  ]
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administração",
  BROKER: "Corretor",
  LEGAL: "Jurídico",
  SECRETARY: "Secretaria"
};

export function AppShell({
  role,
  userName,
  children
}: {
  role: Role;
  userName: string;
  children: React.ReactNode;
}) {
  const nav = NAV[role];

  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-60 tv:w-64 md:shrink-0 md:flex-col border-r hairline bg-app-elevated/40 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b hairline">
          <Link href="/app" className="flex items-center gap-3">
            <Image
              src={LOGO}
              alt="Calebe"
              width={110}
              height={28}
              unoptimized
              className="h-6 w-auto invert brightness-[1.2]"
            />
          </Link>
          <p className="text-[0.65rem] uppercase tracking-[0.16em] font-medium text-gold-400/70 mt-3">
            {ROLE_LABEL[role]}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 text-sm text-sand-100/70 hover:text-sand-50 hover:bg-gold-400/6 rounded-[2px] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t hairline">
          <p className="text-xs text-sand-100/60 truncate">{userName}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            className="mt-2"
          >
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 hover:text-gold-300 transition-colors"
            >
              <LogOut size={12} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Top bar mobile */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b hairline bg-app-bg/90 backdrop-blur px-5 py-3">
        <Link href="/app">
          <Image
            src={LOGO}
            alt="Calebe"
            width={96}
            height={24}
            unoptimized
            className="h-5 w-auto invert brightness-[1.2]"
          />
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/60"
          >
            <LogOut size={12} />
            Sair
          </button>
        </form>
      </header>

      {/* CONTENT FLUIDO · full-width, padding cresce por breakpoint até TV */}
      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 tv:p-14 pb-24 md:pb-20">
        {children}
      </main>

      {/* Bottom tabs mobile (apenas BROKER) */}
      {role === "BROKER" && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t hairline bg-app-bg/95 backdrop-blur grid grid-cols-5">
          {nav.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-3 text-center text-[0.6rem] uppercase tracking-[0.12em] font-medium text-sand-100/55 active:text-gold-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
