import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { TrackingScripts, TrackingNoscript } from "@/components/tracking/TrackingScripts";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { auth } from "@/auth";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Programa de Afiliados — Calebe Investimentos Imobiliários",
  description:
    "Programa de corretores afiliados da Calebe Imóveis. Portfólio curado de Meia Praia, Itapema, Porto Belo e Balneário Camboriú. CRECI 6131J.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Calebe Imóveis — Programa de Afiliados",
    description:
      "Portfólio curado do litoral de Santa Catarina. Distribuição de leads, estrutura e comissões diferenciadas para corretores credenciados.",
    locale: "pt_BR",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#04101F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <head>
        <TrackingScripts />
      </head>
      <body>
        <TrackingNoscript />
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
