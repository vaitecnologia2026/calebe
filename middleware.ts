import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./src/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = new Set<string>([
  "/",
  "/login",
  "/cadastro",
  "/cadastro/obrigado"
]);

const PUBLIC_PREFIXES = [
  "/_next",
  "/favicon",
  "/api/auth",
  "/api/health",
  "/api/webhooks",         // webhook receivers (assinados via HMAC)
  "/api/broker-applications", // cadastro público
  "/manifest.webmanifest",
  "/robots.txt",
  "/icon-",
  "/fonts/"
];

/** Redireciona cada role para seu painel root. */
const ROLE_ROOT: Record<string, string> = {
  ADMIN:     "/app/admin",
  BROKER:    "/app/corretor",
  LEGAL:     "/app/juridico",
  SECRETARY: "/app/secretaria"
};

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isAuthed = !!req.auth?.user;
  const role = (req.auth?.user as { role?: string } | undefined)?.role ?? "";
  const roleRoot = ROLE_ROOT[role];

  // Rota /app/* — precisa de auth + role válido
  if (pathname.startsWith("/app")) {
    if (!isAuthed) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (!roleRoot) {
      // usuário autenticado mas com role inválida — força logout
      return NextResponse.redirect(new URL("/login?error=invalid_role", req.url));
    }
    if (pathname === "/app") {
      return NextResponse.redirect(new URL(roleRoot, req.url));
    }
    // ADMIN pode acessar tudo dentro de /app/*
    if (role === "ADMIN") return NextResponse.next();
    // demais roles restritos ao seu prefixo
    if (!pathname.startsWith(roleRoot)) {
      return NextResponse.redirect(new URL(roleRoot, req.url));
    }
  }

  // Usuário autenticado acessando /login → redireciona para seu painel
  if (pathname === "/login" && isAuthed && roleRoot) {
    return NextResponse.redirect(new URL(roleRoot, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
