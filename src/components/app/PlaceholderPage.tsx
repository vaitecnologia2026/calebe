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
          Em construção
        </p>
        <p className="text-sand-100/70 max-w-md mx-auto">
          {description ??
            "Este módulo está sendo implementado. Volte em breve para acessar suas funcionalidades."}
        </p>
      </div>
    </AppShell>
  );
}
