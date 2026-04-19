import type { Role } from "@prisma/client";
import { AppShell } from "@/components/app/AppShell";

export function PlaceholderPage({
  role,
  userName,
  title,
  description
}: {
  role: Role;
  userName: string;
  title: string;
  description?: string;
}) {
  return (
    <AppShell role={role} userName={userName}>
      <header className="mb-8">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Módulo
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">
          {title}
        </h1>
      </header>
      <div className="card p-10 text-center">
        <p className="text-[0.72rem] uppercase tracking-[0.16em] font-medium text-gold-400/80 mb-3">
          Prévia interativa disponível
        </p>
        <p className="text-sand-100/70 max-w-md mx-auto mb-6">
          {description ??
            "Este módulo está sendo migrado para o sistema real. Enquanto isso, explore a prévia completa de funcionalidades — navegação, tabelas, Kanban jurídico, chat, modais e fluxos de aprovação."}
        </p>
        <a
          href="/demo.html"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 rounded-[2px] bg-gold-gradient px-6 py-3 text-navy-950 text-[0.8rem] uppercase tracking-[0.14em] font-bold hover:opacity-90 transition-opacity"
        >
          Abrir prévia completa →
        </a>
        <p className="text-[0.65rem] uppercase tracking-[0.12em] text-sand-100/45 mt-4">
          Abre em nova aba · senha demo: Calebe@2026!
        </p>
      </div>
    </AppShell>
  );
}
