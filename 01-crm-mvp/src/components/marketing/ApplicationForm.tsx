"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { UF } from "@/lib/validators";
import { trackLead, trackFormSubmit } from "@/lib/tracking";

type FieldErrors = Record<string, string>;

const ufOptions = UF.map((v) => ({ value: v, label: v }));

function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function formatCpf(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function ApplicationForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setErrors((p) => ({ ...p, credentialFileUrl: "Arquivo acima de 8MB." }));
      return;
    }
    const okTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!okTypes.includes(file.type)) {
      setErrors((p) => ({ ...p, credentialFileUrl: "Formato inválido. JPG, PNG, WEBP ou PDF." }));
      return;
    }

    setUploading(true);
    setErrors((p) => ({ ...p, credentialFileUrl: "" }));
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/broker-applications/upload", {
        method: "POST",
        body: form
      });
      if (!res.ok) throw new Error("Falha no upload");
      const data = (await res.json()) as { url: string };
      setUploadedFile({ url: data.url, name: file.name });
    } catch {
      setErrors((p) => ({ ...p, credentialFileUrl: "Não foi possível enviar o arquivo. Tente novamente." }));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? ""),
      cpf: String(formData.get("cpf") ?? ""),
      rg: String(formData.get("rg") ?? "").trim(),
      creci: String(formData.get("creci") ?? "").trim(),
      creciState: String(formData.get("creciState") ?? ""),
      city: String(formData.get("city") ?? "").trim(),
      currentAgency: String(formData.get("currentAgency") ?? "").trim(),
      yearsMarket: formData.get("yearsMarket") ? Number(formData.get("yearsMarket")) : undefined,
      instagram: String(formData.get("instagram") ?? "").trim(),
      credentialFileUrl: uploadedFile?.url ?? "",
      notes: String(formData.get("notes") ?? "").trim()
    };

    try {
      const res = await fetch("/api/broker-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors);
          const first = document.querySelector(`[name="${Object.keys(data.fieldErrors)[0]}"]`);
          (first as HTMLElement | null)?.focus();
        } else {
          setErrors({ _form: data.error ?? "Não foi possível enviar o cadastro." });
        }
        return;
      }

      // Tracking — Padrão VAI: lead gerado + form submit
      trackLead({ source: "broker_application", city: payload.city, uf: payload.creciState });
      trackFormSubmit("broker_application");
      setSuccess(true);
      setTimeout(() => router.push("/cadastro/obrigado"), 1200);
    } catch {
      setErrors({ _form: "Erro de conexão. Tente novamente em instantes." });
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center text-center py-16">
        <CheckCircle2 className="text-gold-400" size={56} />
        <h2 className="text-3xl font-bold tracking-[-0.028em] mt-6">Cadastro recebido</h2>
        <p className="text-sand-100/70 mt-3 max-w-md">
          Nossa equipe irá analisar seus dados e retornar em breve via WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {errors._form && (
        <div className="rounded-[2px] border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {errors._form}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input label="Nome completo" name="fullName" required autoComplete="name" error={errors.fullName} />
        <Input label="E-mail" name="email" type="email" required autoComplete="email" error={errors.email} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Telefone / WhatsApp"
          name="phone"
          required
          autoComplete="tel"
          inputMode="tel"
          placeholder="(47) 99999-9999"
          onInput={(e) => (e.currentTarget.value = formatPhone(e.currentTarget.value))}
          error={errors.phone}
        />
        <Input
          label="CPF"
          name="cpf"
          required
          inputMode="numeric"
          placeholder="000.000.000-00"
          onInput={(e) => (e.currentTarget.value = formatCpf(e.currentTarget.value))}
          error={errors.cpf}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input label="RG" name="rg" required error={errors.rg} />
        <Input label="Instagram" name="instagram" placeholder="@seuperfil" />
      </div>

      <div className="divider-gold my-2" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Input label="CRECI" name="creci" required error={errors.creci} />
        <Select
          label="UF do CRECI"
          name="creciState"
          required
          placeholder="UF"
          options={ufOptions}
          defaultValue=""
          error={errors.creciState}
        />
        <Input label="Cidade de atuação" name="city" required defaultValue="" error={errors.city} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input label="Imobiliária atual (opcional)" name="currentAgency" />
        <Input
          label="Tempo de mercado (anos)"
          name="yearsMarket"
          type="number"
          min={0}
          max={80}
          inputMode="numeric"
        />
      </div>

      {/* Upload credencial CRECI */}
      <div>
        <label className="field-label">Comprovante ou foto da credencial CRECI</label>
        <label
          htmlFor="credentialFile"
          className="flex items-center gap-4 cursor-pointer bg-app-subtle/70 border hairline rounded-[2px] px-4 py-4 hover:border-gold-400/60 transition-colors"
        >
          <span className="h-10 w-10 rounded-[2px] border border-gold-400/30 bg-gold-400/5 flex items-center justify-center text-gold-400">
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          </span>
          <span className="flex flex-col flex-1 min-w-0">
            <span className="text-sm text-sand-50 truncate">
              {uploadedFile ? uploadedFile.name : "Selecionar arquivo (JPG, PNG, WEBP, PDF — até 8MB)"}
            </span>
            <span className="text-xs text-sand-100/60">
              {uploadedFile ? "Enviado com sucesso" : "Clique para anexar"}
            </span>
          </span>
        </label>
        <input
          id="credentialFile"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        {errors.credentialFileUrl && (
          <p className="mt-1.5 text-xs text-danger">{errors.credentialFileUrl}</p>
        )}
      </div>

      <Textarea
        label="Observações (opcional)"
        name="notes"
        rows={3}
        placeholder="Conte um pouco sobre seu perfil, especialidade, idiomas..."
      />

      <div className="pt-4">
        <Button type="submit" disabled={submitting || uploading} fullWidth>
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Enviando…
            </>
          ) : (
            "Enviar Cadastro"
          )}
        </Button>
        <p className="mt-4 text-xs text-sand-100/55 text-center">
          Ao enviar, você concorda com o processo de análise interna da Calebe Investimentos Imobiliários.
        </p>
      </div>
    </form>
  );
}
