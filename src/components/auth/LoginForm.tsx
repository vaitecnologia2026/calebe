"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { trackLogin } from "@/lib/tracking";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "E-mail ou senha inválidos.",
  forbidden: "Você não tem permissão para acessar essa área.",
  invalid_role: "Sessão inválida. Entre novamente.",
  default: "Não foi possível entrar. Tente novamente."
};

export function LoginForm({
  callbackUrl,
  initialError
}: {
  callbackUrl?: string;
  initialError?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError ? ERROR_MESSAGES[initialError] ?? ERROR_MESSAGES.default : null
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl ?? "/app"
    });

    if (!res) {
      setError(ERROR_MESSAGES.default);
      setSubmitting(false);
      return;
    }

    if (res.error) {
      setError(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.default);
      setSubmitting(false);
      return;
    }

    trackLogin("credentials");
    // Redirect: middleware vai levar para o painel correto do role
    window.location.href = res.url ?? callbackUrl ?? "/app";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div className="rounded-[2px] border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      <Input
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="voce@calebe.com.br"
      />
      <Input
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <Button type="submit" disabled={submitting} fullWidth>
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Entrando…
          </>
        ) : (
          "Entrar"
        )}
      </Button>
      <p className="text-xs text-sand-100/45 text-center">
        Ao entrar, você concorda com o registro auditado da sessão.
      </p>
    </form>
  );
}
