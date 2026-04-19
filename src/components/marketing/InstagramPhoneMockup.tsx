"use client";

import { useRef, useState, useEffect } from "react";
import { BadgeCheck, Heart, MessageCircle, Send, MoreVertical, Volume2, VolumeX, Play } from "lucide-react";

/**
 * Phone mockup estilo Instagram Reels — hero da LP pública
 * Espelho de demo-funcionalidades.html (.lp-phone-*)
 *
 * videoSrc: se fornecido, carrega <video autoplay muted loop> com toggle de som no clique.
 * Se ausente, mostra poster gradient + botão play (fallback).
 */
type Props = {
  videoSrc?: string;
  posterUrl?: string;
  handle?: string;
  legenda?: string;
};

export function InstagramPhoneMockup({
  videoSrc = "/videos/hero-lp.mp4",
  posterUrl,
  handle = "calebe_imoveis",
  legenda = "Corretor afiliado Calebe · rede nacional"
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [hintVisible, setHintVisible] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHintVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);

  function toggleSound(e: React.MouseEvent) {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    v.play().catch(() => {});
    setHintVisible(false);
  }

  return (
    <div className="relative flex items-center justify-center" style={{ perspective: 1200 }}>
      {/* Glow dourado ao redor */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none"
        style={{
          width: "120%",
          height: "85%",
          background: "radial-gradient(ellipse, rgba(201,169,97,.22) 0%, rgba(201,169,97,0) 65%)",
          filter: "blur(40px)"
        }}
      />

      <div
        className="relative overflow-hidden bg-black transition-transform duration-500 hover:rotate-0"
        style={{
          width: "min(280px, 78vw)",
          aspectRatio: "9 / 19.5",
          borderRadius: 36,
          border: "8px solid #1a1e27",
          boxShadow: "0 40px 80px -20px rgba(0,0,0,.7), 0 20px 40px -10px rgba(201,169,97,.25), inset 0 0 0 2px rgba(255,255,255,.04)",
          transform: "rotate(-2deg)"
        }}
      >
        {/* Notch superior */}
        <span
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
          style={{ width: 90, height: 22, background: "#000", borderRadius: "0 0 16px 16px" }}
        />
        {/* Home indicator bottom */}
        <span
          aria-hidden
          className="absolute bottom-[6px] left-1/2 -translate-x-1/2 z-20"
          style={{ width: 100, height: 4, background: "rgba(255,255,255,.4)", borderRadius: 2 }}
        />

        {/* Tela */}
        <div className="absolute inset-0 overflow-hidden bg-black">
          {!videoFailed && videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              onClick={toggleSound}
              onError={() => setVideoFailed(true)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-[2]"
              style={{ width: "100%", height: "calc(100% + 4px)", objectFit: "cover", background: "#000" }}
            />
          ) : (
            <div
              className="absolute inset-0 z-[5] cursor-pointer"
              style={{
                background: posterUrl
                  ? `url('${posterUrl}') center/cover`
                  : "linear-gradient(135deg, #1a1e27 0%, #0A0F1A 100%)"
              }}
            >
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,.45) 100%)"
                }}
              />
              <button
                type="button"
                aria-label="Reproduzir vídeo"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full z-[18] transition-transform hover:scale-110"
                style={{
                  width: 64,
                  height: 64,
                  background: "rgba(255,255,255,.95)",
                  boxShadow: "0 10px 40px rgba(0,0,0,.5), 0 0 0 6px rgba(255,255,255,.12)"
                }}
              >
                <Play size={28} style={{ color: "#0A0F1A", marginLeft: 3 }} />
              </button>
            </div>
          )}
        </div>

        {/* Header estilo Instagram (logo + verificado + som) */}
        <div
          className="absolute top-8 left-0 right-0 z-[15] px-3.5 py-2.5 flex items-center justify-between"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 100%)" }}
        >
          <div className="flex items-center gap-[9px] text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,.55)" }}>
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(0,0,0,.85)",
                padding: 2,
                border: "1.5px solid rgba(255,255,255,.9)"
              }}
            >
              <span className="text-[0.7rem] font-extrabold text-white">CI</span>
            </div>
            <span
              className="underline underline-offset-[3px] tracking-tight"
              style={{ fontWeight: 700, fontSize: "0.92rem", textDecorationThickness: 1 }}
            >
              {handle}
            </span>
            <span
              className="inline-flex items-center justify-center shrink-0"
              style={{ width: 16, height: 16, color: "#DEB96D", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.5))" }}
              title="Verificado"
              aria-label="Conta verificada"
            >
              <BadgeCheck size={16} strokeWidth={2.2} />
            </span>
          </div>
          <button
            type="button"
            onClick={toggleSound}
            aria-label={muted ? "Ativar som do vídeo" : "Silenciar vídeo"}
            className="inline-flex items-center justify-center transition-all hover:scale-110"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(0,0,0,.55)",
              color: "#fff",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,.2)"
            }}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

        {/* Hint "toque para ouvir" (some em 5s) */}
        {hintVisible && (
          <span
            className="absolute z-[16] pointer-events-none whitespace-nowrap animate-[lpSoundHintFade_5s_ease_forwards]"
            style={{
              top: 68,
              right: "50%",
              transform: "translateX(50%)",
              padding: "0.35rem 0.75rem",
              borderRadius: 9999,
              background: "rgba(0,0,0,.7)",
              color: "#fff",
              fontSize: "0.65rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,.15)"
            }}
          >
            Toque para ouvir 🔊
          </span>
        )}

        {/* Ações laterais (Reels) */}
        <div className="absolute right-2 z-[15] flex flex-col gap-3.5 items-center text-white" style={{ bottom: 90 }}>
          <div className="flex flex-col items-center gap-0.5">
            <Heart size={24} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.7))" }} />
            <span className="text-[0.6rem] font-bold" style={{ textShadow: "0 1px 3px rgba(0,0,0,.8)" }}>
              24,8K
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <MessageCircle size={24} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.7))" }} />
            <span className="text-[0.6rem] font-bold" style={{ textShadow: "0 1px 3px rgba(0,0,0,.8)" }}>
              312
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Send size={22} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.7))" }} />
            <span className="text-[0.6rem] font-bold" style={{ textShadow: "0 1px 3px rgba(0,0,0,.8)" }}>
              Enviar
            </span>
          </div>
          <MoreVertical size={22} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.7))" }} />
        </div>

        {/* Legenda bottom */}
        <div
          className="absolute z-[15] text-white"
          style={{
            bottom: 18,
            left: 12,
            right: 62,
            fontSize: "0.72rem",
            lineHeight: 1.4,
            textShadow: "0 1px 4px rgba(0,0,0,.8)"
          }}
        >
          <strong className="block mb-0.5 font-bold">@{handle.replace(/^@/, "").replace("_", ".")}</strong>
          <p className="text-white/85" style={{ fontSize: "0.68rem" }}>
            {legenda}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes lpSoundHintFade {
          0%, 10% { opacity: 0; transform: translate(50%, -4px); }
          15%, 85% { opacity: 1; transform: translate(50%, 0); }
          100% { opacity: 0; transform: translate(50%, -4px); }
        }
      `}</style>
    </div>
  );
}
