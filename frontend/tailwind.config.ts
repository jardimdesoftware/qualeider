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
        'bricolage': ['Rawline', 'Arial', 'sans-serif'],
        'rawline': ['Rawline', 'Arial', 'sans-serif'],
      },
      colors: {
        // Legacy (manter para compatibilidade)
        'green-background': "#2f9e41",

        // Brand Colors (novo sistema de design)
        'brand-primary': '#2f9e41',
        'brand-primary-hover': '#1f7a30',
        'brand-secondary': '#cd191e',
        'brand-accent': '#e1f5e6',
        'brand-surface': '#ffffff',
        'brand-border': '#e0e0e0',
        'brand-muted': '#4b5563',
        'gov-blue': '#1351b4',

        // Identidade visual do Admin (diferencia da area do Vaqueiro)
        'admin-background': '#0c326f',
        'admin-background-hover': '#071d41',
      }
    },
  },
  plugins: [],
};
export default config;
