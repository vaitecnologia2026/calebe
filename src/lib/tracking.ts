/**
 * Tracking helper — Padrão VAI
 * Abstrai Facebook Pixel + Google Analytics 4 + GTM atrás de uma API única.
 * IDs configurados via env vars (.env): NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_FB_PIXEL_ID, NEXT_PUBLIC_GTM_ID.
 *
 * Uso:
 *   import { track, trackLead, trackCta, trackFormSubmit } from "@/lib/tracking";
 *   trackLead({ source: "broker_application" });
 */

type TrackParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const isBrowser = () => typeof window !== "undefined";

/**
 * Dispara um evento custom em TODAS as plataformas configuradas.
 * Se nenhuma plataforma estiver carregada, loga no console (modo dev).
 */
export function track(eventName: string, params: TrackParams = {}): void {
  if (!isBrowser()) return;

  // Google Analytics 4
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }

  // Facebook Pixel (eventos custom)
  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", eventName, params);
  }

  // Google Tag Manager
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...params });
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[VAI-track]", eventName, params);
  }
}

/**
 * Eventos nomeados (padrão VAI: CTA, login, cadastro, formulário, lead, compra).
 * Ao adicionar novos eventos estratégicos, registrar aqui.
 */

export const trackCta = (label: string, extra: TrackParams = {}) =>
  track("cta_click", { label, ...extra });

export const trackLogin = (method: string = "credentials") =>
  track("login", { method });

export const trackSignup = (role: string = "broker") =>
  track("sign_up", { role });

export const trackFormSubmit = (formName: string, extra: TrackParams = {}) =>
  track("form_submit", { form_name: formName, ...extra });

export const trackLead = (params: TrackParams = {}) => {
  // GA4 reconhece "generate_lead" como evento recomendado
  track("generate_lead", params);
  // Facebook Pixel evento padrão é "Lead"
  if (isBrowser() && typeof window.fbq === "function") {
    window.fbq("track", "Lead", params);
  }
};

export const trackPurchase = (value: number, currency: string = "BRL", extra: TrackParams = {}) => {
  track("purchase", { value, currency, ...extra });
  if (isBrowser() && typeof window.fbq === "function") {
    window.fbq("track", "Purchase", { value, currency, ...extra });
  }
};

export const trackPageView = (path: string) => {
  if (!isBrowser()) return;
  if (typeof window.gtag === "function" && process.env.NEXT_PUBLIC_GA_ID) {
    window.gtag("config", process.env.NEXT_PUBLIC_GA_ID, { page_path: path });
  }
  if (typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
};
