import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  "/api/webhooks",
  "/api/broker-applications",
  "/manifest.webmanifest",
  "/robots.txt",
  "/icon-",
  "/fonts/"
];

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token"
];

function hasSession(req: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => req.cookies.has(name));
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const authed = hasSession(req);

  if (pathname.startsWith("/app")) {
    if (!authed) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/login" && authed) {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
