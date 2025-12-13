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
        'bricolage': ['Bricolage Grotesque', 'sans-serif'],
      },
      colors: {
        // Legacy (manter para compatibilidade)
        'green-background': "#20732D",
        
        // Brand Colors (novo sistema de design)
        'brand-primary': '#1e3a29',
        'brand-primary-hover': '#2d5a42',
        'brand-secondary': '#d97706',
        'brand-accent': '#fbbf24',
      }
    },
  },
  plugins: [],
};
export default config;