import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        bricolage: ["Bricolage Grotesque", "sans-serif"],
        sans: ["var(--font-open-sans)", "sans-serif"],
        rawline: ["var(--font-open-sans)", "Arial", "sans-serif"],
      },
      colors: {
        // Legacy (manter para compatibilidade) — alinhada ao verde oficial da marca
        "green-background": "#2f9e41",

        // Brand Colors — alinhadas ao Manual de Aplicação da Marca do
        // Instituto Federal (verde #2f9e41 / Pantone 362C é a cor de ação
        // oficial da marca; vermelho é uso pontual, nunca cor de superfície).
        "brand-primary": "#2f9e41",
        "brand-primary-hover": "#237a32",
        "brand-secondary": "#d97706",
        "brand-accent": "#fbbf24",
        "brand-emphasis": "#cd191e",

        // Tokens usados por telas ainda nao migradas
        "brand-surface": "#ffffff",
        "brand-border": "#e0e0e0",
        "brand-muted": "#4b5563",
        "gov-blue": "#1351b4",

        // Identidade visual do Admin (diferencia da area do Vaqueiro)
        "admin-background": "#0c326f",
        "admin-background-hover": "#071d41",
      },
    },
  },
  plugins: [],
};
export default config;
