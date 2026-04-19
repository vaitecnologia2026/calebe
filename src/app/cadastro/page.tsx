import Link from "next/link";
import { ArrowLeft, Lock, FileCheck, Users } from "lucide-react";
import { ApplicationForm } from "@/components/marketing/ApplicationForm";

export const metadata = {
  title: "Cadastro de Corretor — Programa de Afiliados Calebe",
  description:
    "Cadastre-se para trabalhar com o portfólio curado da Calebe Investimentos Imobiliários. CRECI 6131J."
};

const assurances = [
  { icon: Lock, title: "Análise discreta", body: "Seus dados são avaliados apenas pela equipe Calebe." },
  { icon: FileCheck, title: "CRECI validado", body: "Verificamos manualmente sua situação junto ao órgão." },
  { icon: Users, title: "Entrada gradual", body: "Aprovação conforme abertura de vagas do programa." }
];

export default function CadastroPage() {
  return (
    <main className="min-h-dvh flex flex-col">
      <header className="border-b hairline">
        <div className="container-site flex items-center justify-between py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] font-medium text-sand-100/70 hover:text-gold-300 transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar
          </Link>
          <span className="text-[0.7rem] uppercase tracking-[0.14em] font-medium text-gold-400/80">
            05 · Cadastro · Programa de Afiliados
          </span>
        </div>
      </header>

      <div className="container-site grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-12 lg:gap-20 py-12 md:py-20 flex-1">
        <section className="order-2 lg:order-1">
          <p className="pill mb-6">Passo 1 de 3 · Informações</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-[-0.028em]">
            Solicite sua <span className="text-gold-400">adesão</span> ao programa.
          </h1>
          <p className="mt-5 text-sand-100/70 max-w-lg">
            Preencha os campos abaixo com atenção. Após o envio, nossa equipe de análise entrará em
            contato via WhatsApp em até 48 horas úteis.
          </p>

          <div className="mt-10">
            <ApplicationForm />
          </div>
        </section>

        <aside className="order-1 lg:order-2 lg:pt-24">
          <div className="sticky top-8 space-y-6">
            <div className="card p-6">
              <p className="meta-label mb-3">O que acontece depois</p>
              <ol className="space-y-4 mt-2">
                {assurances.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-4">
                    <span className="shrink-0 h-10 w-10 rounded-[2px] border border-gold-400/30 bg-gold-400/5 flex items-center justify-center text-gold-400">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="font-medium text-sand-50">{title}</p>
                      <p className="text-sm text-sand-100/70 mt-0.5">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-xs text-sand-100/55 leading-relaxed px-1">
              Seus dados são tratados conforme a LGPD. Finalidade: análise da sua adesão ao programa
              de afiliados. Base legal: legítimo interesse + consentimento do titular.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
