import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const LOGO = "https://d78txhfo8gp8r.cloudfront.net/calebe/arquivos/logo.png";

const ROLE_ROOT: Record<string, string> = {
  ADMIN: "/app/admin",
  BROKER: "/app/corretor",
  LEGAL: "/app/juridico",
  SECRETARY: "/app/secretaria"
};

export const metadata = {
  title: "Entrar — Calebe Imóveis",
  description: "Acesso restrito ao sistema Calebe Investimentos Imobiliários."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (role && ROLE_ROOT[role]) redirect(ROLE_ROOT[role]);

  const sp = await searchParams;
  return (
    <main className="min-h-dvh flex flex-col lg:flex-row">
      {/* Lado esquerdo — branding institucional */}
      <aside className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 border-r hairline bg-gradient-to-br from-navy-900 via-app-bg to-navy-950 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 100% 0%, rgba(201,169,97,0.18) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(44,86,128,0.4) 0%, transparent 60%)"
          }}
        />
        <div className="relative z-10">
          <Link href="/" className="inline-block">
            <Image
              src={LOGO}
              alt="Calebe Imóveis"
              width={160}
              height={40}
              unoptimized
              className="h-8 w-auto invert brightness-[1.2]"
            />
          </Link>
        </div>
        <div className="relative z-10">
          <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-4">
            Sistema Calebe
          </p>
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.05] tracking-[-0.032em] text-sand-50">
            A terra prometida{" "}
            <span className="text-gold-400">opera com método</span>.
          </h1>
          <p className="mt-6 text-sand-100/70 max-w-md leading-relaxed">
            Este acesso é exclusivo para a equipe e corretores credenciados. O cadastro
            de novos corretores acontece pelo site público, com avaliação interna.
          </p>
        </div>
        <div className="relative z-10 text-[0.65rem] uppercase tracking-[0.16em] text-sand-100/40">
          Calebe Investimentos Imobiliários · CRECI 6131J
        </div>
      </aside>

      {/* Lado direito — formulário */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <div className="lg:hidden absolute top-6 left-6">
          <Link href="/">
            <Image
              src={LOGO}
              alt="Calebe"
              width={120}
              height={30}
              unoptimized
              className="h-7 w-auto invert brightness-[1.2]"
            />
          </Link>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-3">
              Acesso restrito
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.028em] text-sand-50">
              Entrar no sistema
            </h2>
            <p className="mt-3 text-sand-100/65 text-sm">
              Use as credenciais fornecidas pela administração da Calebe.
            </p>
          </div>

          <LoginForm callbackUrl={sp.callbackUrl} initialError={sp.error} />

          <div className="mt-10 pt-6 border-t hairline text-sm">
            <p className="text-sand-100/55">
              Ainda não é credenciado?{" "}
              <Link href="/cadastro" className="text-gold-300 hover:text-gold-200 underline-offset-4 hover:underline">
                Solicite adesão ao programa
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
