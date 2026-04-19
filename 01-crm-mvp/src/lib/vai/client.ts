/**
 * VAI API HTTP Client (service layer)
 * Documentação oficial: https://api.vaicrm.com.br/docs#
 *
 * Esse cliente abstrai a chamada HTTP. Os endpoints exatos são mapeados
 * em src/lib/vai/{contacts,conversations,messages,webhooks}.ts — troque
 * apenas aquelas funções quando mapear a spec real.
 *
 * Configuração via env:
 *   VAI_API_BASE_URL   (default: https://api.vaicrm.com.br)
 *   VAI_API_TOKEN      (bearer token da instância)
 *   VAI_INSTANCE_ID    (opcional, usado em alguns endpoints)
 */

export class VaiApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "VaiApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = process.env.VAI_API_BASE_URL ?? "https://api.vaicrm.com.br";
  const url = new URL(path.startsWith("/") ? path : `/${path}`, base);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function vaiRequest<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = process.env.VAI_API_TOKEN;
  if (!token) throw new VaiApiError("VAI_API_TOKEN não configurado.", 503);

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(opts.headers ?? {})
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    cache: "no-store"
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    throw new VaiApiError(
      (data as { message?: string })?.message ?? `VAI API error ${res.status}`,
      res.status,
      data
    );
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
