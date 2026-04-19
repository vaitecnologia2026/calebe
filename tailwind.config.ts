import type { Config } from "tailwindcss";

/**
 * Brand Manual v1.0 — Calebe Imóveis
 * Tokens autoritativos (navy + gold + sand + gray + semantic)
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      tv: "1920px"   // Padrão VAI: TV/4K
    },
    extend: {
      colors: {
        navy: {
          50:  "#F0F4F9",
          100: "#DCE5EE",
          200: "#B5C4D7",
          300: "#87A0B9",
          400: "#547B9A",
          500: "#2C5680",
          600: "#1F4068",
          700: "#16314F",
          800: "#0E2A47",
          900: "#081A2E",
          950: "#04101F"
        },
        gold: {
          50:  "#FBF7EE",
          100: "#F5EBD0",
          200: "#ECD5A0",
          300: "#DEB96D",
          400: "#C9A961",
          500: "#B58E3E",
          600: "#8E6D2D",
          700: "#6B5223",
          800: "#4A381A",
          900: "#2A1F0A"
        },
        sand: {
          50:  "#FBF9F4",
          100: "#F5EFE4",
          200: "#E8DFC8",
          300: "#D2C4A1"
        },
        gray: {
          50:  "#F7F8FA",
          100: "#EDEFF3",
          200: "#D9DDE5",
          300: "#B3BAC8",
          400: "#8A93A6",
          500: "#5F6979",
          600: "#434B58",
          700: "#2D333D",
          800: "#1A1E25",
          900: "#0E1116"
        },
        success: "#0F7B5C",
        danger: "#B83232",
        // superfícies app (dark theme — baseado no data-theme="dark" do manual)
        app: {
          bg: "#0B0E13",
          elevated: "#131720",
          subtle: "#161B25",
          canvas: "#0B0E13",
          border: "#232A37",
          "border-strong": "#2F3848"
        }
      },
      fontFamily: {
        display: ["var(--font-sans)", "Plus Jakarta Sans", "-apple-system", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "-apple-system", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SF Mono", "Menlo", "monospace"]
      },
      letterSpacing: {
        "display": "-0.02em",
        "display-tight": "-0.03em",
        "mono-wide": "0.08em",
        "mono-xwide": "0.12em",
        "mono-label": "0.2em"
      },
      boxShadow: {
        "elev-1": "0 1px 2px rgba(0,0,0,.35), 0 1px 4px rgba(0,0,0,.25)",
        "elev-2": "0 4px 12px rgba(0,0,0,.40), 0 2px 6px rgba(0,0,0,.25)",
        "elev-3": "0 12px 32px rgba(0,0,0,.55), 0 6px 14px rgba(0,0,0,.30)",
        "gold-glow": "0 0 0 1px rgba(201,169,97,.25), 0 8px 28px -12px rgba(201,169,97,.35)",
        "navy-inset": "inset 0 1px 0 rgba(255,255,255,0.04)"
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #DEB96D 0%, #C9A961 45%, #B58E3E 100%)",
        "navy-hero": "radial-gradient(circle at 100% 0%, rgba(201,169,97,0.18) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(44,86,128,0.4) 0%, transparent 60%)",
        "navy-gradient": "linear-gradient(180deg, #081A2E 0%, #0E2A47 45%, #04101F 100%)"
      },
      maxWidth: {
        "container": "1240px",
        "container-tv": "1440px"
      }
    }
  },
  plugins: []
};

export default config;
