import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Cadastro enviado — Calebe Afiliados" };

export default function ObrigadoPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center container-site py-20">
      <div className="max-w-xl text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold-400/10 border border-gold-400/40">
          <CheckCircle2 size={32} className="text-gold-400" />
        </span>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-[-0.028em] mt-8">
          Cadastro <span className="text-gold-400">recebido</span>.
        </h1>
        <p className="mt-5 text-sand-100/70 leading-relaxed">
          Obrigado. Nossa equipe irá analisar sua documentação e retornar em até 48 horas úteis
          pelo WhatsApp informado. Enquanto isso, salve o contato oficial da Calebe e
          acompanhe nossas atualizações no Instagram.
        </p>
        <div className="mt-10">
          <Link href="/" className="btn-outline">Voltar para a página inicial</Link>
        </div>
      </div>
    </main>
  );
}
