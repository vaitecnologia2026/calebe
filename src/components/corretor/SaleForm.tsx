"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StepKey = "imovel" | "comprador" | "conjuge" | "negociacao" | "documentos";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "imovel", label: "Imóvel" },
  { key: "comprador", label: "Comprador" },
  { key: "conjuge", label: "Cônjuge" },
  { key: "negociacao", label: "Negociação" },
  { key: "documentos", label: "Documentos" }
];

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function parseCurrency(v: string): number {
  const clean = v.replace(/[R$\s.]/g, "").replace(",", ".");
  return Number(clean) || 0;
}

export function SaleForm() {
  const router = useRouter();
  const [step, setStep] = useState<StepKey>("imovel");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; status: string } | null>(null);

  const idx = STEPS.findIndex((s) => s.key === step);
  const pct = Math.round(((idx + 1) / STEPS.length) * 100);

  async function submit(e: React.FormEvent<HTMLFormElement>, mode: "draft" | "submit") {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      const payload = {
        mode,
        imovel: {
          code: String(fd.get("im_codigo") ?? "").trim(),
          title: String(fd.get("im_titulo") ?? "").trim(),
          addressFull: String(fd.get("im_endereco") ?? "").trim(),
          neighborhood: String(fd.get("im_bairro") ?? "").trim(),
          city: String(fd.get("im_cidade") ?? "").trim(),
          type: String(fd.get("im_tipo") ?? "Apartamento"),
          price: parseCurrency(String(fd.get("im_valor_anunciado") ?? "0")),
          commissionPct: Number(fd.get("im_comissao") ?? 0),
          notes: String(fd.get("im_obs") ?? "").trim()
        },
        saleValue: parseCurrency(String(fd.get("im_valor_fechado") ?? fd.get("im_valor_anunciado") ?? "0")),
        condicao: String(fd.get("im_condicao") ?? "").trim(),
        comprador: {
          nome: String(fd.get("c_nome") ?? "").trim(),
          cpf: String(fd.get("c_cpf") ?? "").replace(/\D/g, ""),
          rg: String(fd.get("c_rg") ?? "").trim(),
          nascimento: String(fd.get("c_nasc") ?? "").trim() || null,
          estadoCivil: String(fd.get("c_estadocivil") ?? "solteiro"),
          profissao: String(fd.get("c_profissao") ?? "").trim(),
          nacionalidade: String(fd.get("c_nacionalidade") ?? "Brasileira").trim(),
          email: String(fd.get("c_email") ?? "").trim() || null,
          tel: String(fd.get("c_tel") ?? "").replace(/\D/g, ""),
          endereco: String(fd.get("c_endereco") ?? "").trim(),
          bairro: String(fd.get("c_bairro") ?? "").trim(),
          cidade: String(fd.get("c_cidade") ?? "").trim(),
          uf: String(fd.get("c_uf") ?? "").trim(),
          cep: String(fd.get("c_cep") ?? "").trim()
        },
        conjuge: {
          nome: String(fd.get("co_nome") ?? "").trim() || null,
          cpf: String(fd.get("co_cpf") ?? "").replace(/\D/g, "") || null,
          rg: String(fd.get("co_rg") ?? "").trim() || null,
          nascimento: String(fd.get("co_nasc") ?? "").trim() || null,
          email: String(fd.get("co_email") ?? "").trim() || null,
          tel: String(fd.get("co_tel") ?? "").replace(/\D/g, "") || null
        },
        negociacao: {
          tipo: String(fd.get("n_tipo") ?? "vista"),
          entrada: parseCurrency(String(fd.get("n_entrada") ?? "0")),
          financiado: parseCurrency(String(fd.get("n_financiado") ?? "0")),
          banco: String(fd.get("n_banco") ?? "").trim() || null,
          fgts: String(fd.get("n_fgts") ?? "nao") === "sim",
          prazoMeses: Number(fd.get("n_prazo") ?? 0) || null,
          dataVenda: String(fd.get("n_data_venda") ?? "").trim() || null,
          prevAssinatura: String(fd.get("n_prev_assinatura") ?? "").trim() || null,
          obs: String(fd.get("n_obs") ?? "").trim()
        }
      };

      const res = await fetch("/api/corretor/sales", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao salvar venda.");
      setCreated({ id: data.id, status: data.status });
      // Refresh the list on success
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="card p-10 text-center">
        <p className="text-[0.72rem] uppercase tracking-[0.16em] font-semibold text-gold-300 mb-2">
          Venda {created.status === "SUBMITTED" ? "enviada ao jurídico" : "salva como rascunho"}
        </p>
        <h2 className="text-2xl font-bold tracking-[-0.024em] mb-3">
          {created.id.slice(0, 8)} registrada
        </h2>
        <p className="text-sand-100/70 max-w-md mx-auto mb-6">
          {created.status === "SUBMITTED"
            ? "O jurídico foi notificado e começará a elaboração do contrato."
            : "Volte mais tarde para continuar preenchendo ou enviar ao jurídico."}
        </p>
        <button
          className="btn-base btn-gold"
          onClick={() => router.push("/app/corretor/vendas")}
        >
          Ver minhas vendas
        </button>
      </div>
    );
  }

  return (
    <form
      className="card overflow-hidden"
      onSubmit={(e) => submit(e, "submit")}
    >
      <div className="px-6 pt-5 pb-3 flex items-center justify-between">
        <p className="text-[0.72rem] uppercase tracking-[0.12em] font-semibold text-sand-100/60">
          Etapa <span className="text-gold-400">{idx + 1}</span> de {STEPS.length}
        </p>
        <p className="text-[0.72rem] text-sand-100/60">{pct}% preenchido</p>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-6 pb-3 border-b hairline">
        {STEPS.map((s, i) => (
          <button
            type="button"
            key={s.key}
            onClick={() => setStep(s.key)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-[0.72rem] font-semibold uppercase tracking-[0.1em] transition-colors ${
              s.key === step
                ? "bg-gold-gradient text-navy-950"
                : i < idx
                  ? "bg-green-500/10 text-green-300"
                  : "text-sand-100/60 hover:bg-app-subtle/60"
            }`}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-[0.65rem]">
              {i + 1}
            </span>
            {s.label}
          </button>
        ))}
      </nav>

      <div className="p-6 md:p-8 space-y-5">
        <Section visible={step === "imovel"}>
          <h3 className="text-lg font-bold tracking-[-0.02em] text-sand-50 mb-4">
            Dados do imóvel
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <F label="Código" name="im_codigo" placeholder="CAL-000" />
            <F label="Título" name="im_titulo" className="md:col-span-2" required />
            <F label="Endereço completo" name="im_endereco" className="md:col-span-2" />
            <F label="Bairro" name="im_bairro" />
            <F label="Cidade" name="im_cidade" />
            <div>
              <label className="field-label">Tipo do imóvel</label>
              <select className="field-input" name="im_tipo" defaultValue="Apartamento">
                <option>Apartamento</option>
                <option>Cobertura</option>
                <option>Casa</option>
                <option>Terreno</option>
                <option>Comercial</option>
              </select>
            </div>
            <F label="Valor anunciado" name="im_valor_anunciado" placeholder="R$ 0,00" />
            <F label="Valor fechado" name="im_valor_fechado" placeholder="R$ 0,00" required />
            <F label="Comissão (%)" name="im_comissao" placeholder="2.5" />
            <F
              label="Condição especial"
              name="im_condicao"
              className="md:col-span-3"
              placeholder="Ex: IGP-M congelado por 12 meses"
            />
            <div className="md:col-span-3">
              <label className="field-label">Observações do imóvel</label>
              <textarea className="field-input" rows={2} name="im_obs" />
            </div>
          </div>
        </Section>

        <Section visible={step === "comprador"}>
          <h3 className="text-lg font-bold tracking-[-0.02em] text-sand-50 mb-4">
            Dados do comprador
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <F label="Nome completo" name="c_nome" className="md:col-span-2" required />
            <F
              label="CPF"
              name="c_cpf"
              required
              onInput={(e) => (e.currentTarget.value = maskCpf(e.currentTarget.value))}
            />
            <F label="RG" name="c_rg" />
            <F label="Data de nascimento" name="c_nasc" type="date" />
            <div>
              <label className="field-label">Estado civil</label>
              <select className="field-input" name="c_estadocivil" defaultValue="solteiro">
                <option value="solteiro">Solteiro(a)</option>
                <option value="casado">Casado(a)</option>
                <option value="uniao">União estável</option>
                <option value="divorciado">Divorciado(a)</option>
                <option value="viuvo">Viúvo(a)</option>
              </select>
            </div>
            <F label="Profissão" name="c_profissao" />
            <F label="Nacionalidade" name="c_nacionalidade" defaultValue="Brasileira" />
            <F label="E-mail" name="c_email" type="email" />
            <F
              label="Telefone"
              name="c_tel"
              required
              onInput={(e) => (e.currentTarget.value = maskPhone(e.currentTarget.value))}
            />
            <F label="Endereço" name="c_endereco" className="md:col-span-2" />
            <F label="Bairro" name="c_bairro" />
            <F label="Cidade" name="c_cidade" />
            <F label="UF" name="c_uf" maxLength={2} />
            <F label="CEP" name="c_cep" placeholder="00000-000" />
          </div>
        </Section>

        <Section visible={step === "conjuge"}>
          <h3 className="text-lg font-bold tracking-[-0.02em] text-sand-50 mb-4">
            Dados do cônjuge
          </h3>
          <p className="text-sm text-sand-100/60 mb-4">
            Preencha apenas se o comprador for casado(a) ou união estável.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <F label="Nome completo" name="co_nome" className="md:col-span-2" />
            <F
              label="CPF"
              name="co_cpf"
              onInput={(e) => (e.currentTarget.value = maskCpf(e.currentTarget.value))}
            />
            <F label="RG" name="co_rg" />
            <F label="Data de nascimento" name="co_nasc" type="date" />
            <F label="E-mail" name="co_email" type="email" />
            <F
              label="Telefone"
              name="co_tel"
              onInput={(e) => (e.currentTarget.value = maskPhone(e.currentTarget.value))}
              className="md:col-span-2"
            />
          </div>
        </Section>

        <Section visible={step === "negociacao"}>
          <h3 className="text-lg font-bold tracking-[-0.02em] text-sand-50 mb-4">
            Dados da negociação
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="field-label">Tipo de negociação</label>
              <select className="field-input" name="n_tipo" defaultValue="hibrida">
                <option value="vista">À vista</option>
                <option value="financiamento">Financiamento</option>
                <option value="hibrida">Híbrida</option>
              </select>
            </div>
            <F label="Valor de entrada" name="n_entrada" placeholder="R$ 0,00" />
            <F label="Valor financiado" name="n_financiado" placeholder="R$ 0,00" />
            <div>
              <label className="field-label">Banco</label>
              <select className="field-input" name="n_banco" defaultValue="">
                <option value="">— selecionar —</option>
                <option>Caixa Econômica Federal</option>
                <option>Banco do Brasil</option>
                <option>Itaú</option>
                <option>Bradesco</option>
                <option>Santander</option>
                <option>Outro</option>
              </select>
            </div>
            <div>
              <label className="field-label">Uso de FGTS</label>
              <select className="field-input" name="n_fgts" defaultValue="nao">
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
              </select>
            </div>
            <F label="Prazo (meses)" name="n_prazo" type="number" min={12} max={420} />
            <F label="Data da venda" name="n_data_venda" type="date" />
            <F label="Previsão assinatura" name="n_prev_assinatura" type="date" />
            <div className="md:col-span-3">
              <label className="field-label">Observações comerciais</label>
              <textarea className="field-input" rows={2} name="n_obs" />
            </div>
          </div>
        </Section>

        <Section visible={step === "documentos"}>
          <h3 className="text-lg font-bold tracking-[-0.02em] text-sand-50 mb-2">
            Documentação
          </h3>
          <p className="text-sm text-sand-100/60 mb-4">
            Upload de documentos será ativado em breve. Para a primeira versão, envie os arquivos
            por WhatsApp ao jurídico quando solicitado.
          </p>
          <div className="rounded-[2px] border border-gold-400/30 bg-gold-400/5 p-4 text-sm">
            <p className="text-gold-300 font-semibold mb-2">
              Lista de documentos que o jurídico solicitará
            </p>
            <ul className="list-disc list-inside text-sand-100/75 space-y-1">
              <li>RG / CNH frente e verso</li>
              <li>CPF</li>
              <li>Comprovante de residência (até 90 dias)</li>
              <li>Comprovante de renda (holerite ou IR)</li>
              <li>Certidão civil (nascimento ou casamento)</li>
              <li>Proposta assinada pelo cliente</li>
              <li>Recibos de entrada / sinal</li>
            </ul>
          </div>
        </Section>

        {error && (
          <div className="rounded-[2px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>

      <footer className="px-6 py-4 border-t hairline flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-base btn-outline"
            style={{ padding: ".65rem 1rem" }}
            disabled={idx === 0 || submitting}
            onClick={() => setStep(STEPS[Math.max(0, idx - 1)].key)}
          >
            ← Anterior
          </button>
          <button
            type="button"
            className="btn-base btn-outline"
            style={{ padding: ".65rem 1rem" }}
            disabled={idx === STEPS.length - 1 || submitting}
            onClick={() => setStep(STEPS[Math.min(STEPS.length - 1, idx + 1)].key)}
          >
            Próximo →
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-base btn-outline"
            style={{ padding: ".65rem 1.25rem" }}
            disabled={submitting}
            onClick={(e) => {
              const form = (e.target as HTMLButtonElement).closest("form");
              if (!form) return;
              const fakeEvent = { preventDefault: () => {}, currentTarget: form } as React.FormEvent<HTMLFormElement>;
              submit(fakeEvent, "draft");
            }}
          >
            Salvar rascunho
          </button>
          <button
            type="submit"
            className="btn-base btn-gold"
            style={{ padding: ".65rem 1.25rem" }}
            disabled={submitting}
          >
            {submitting ? "Enviando..." : "Enviar ao jurídico"}
          </button>
        </div>
      </footer>
    </form>
  );
}

function Section({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return <div className={visible ? "" : "hidden"}>{children}</div>;
}

function F({
  label,
  name,
  className,
  required,
  type,
  placeholder,
  defaultValue,
  min,
  max,
  maxLength,
  onInput
}: {
  label: string;
  name: string;
  className?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  min?: number;
  max?: number;
  maxLength?: number;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={className}>
      <label className="field-label">
        {label}
        {required && " *"}
      </label>
      <input
        className="field-input"
        name={name}
        type={type ?? "text"}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={min}
        max={max}
        maxLength={maxLength}
        onInput={onInput}
      />
    </div>
  );
}
