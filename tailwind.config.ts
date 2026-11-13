import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        surface: "#121215",
        "surface-card": "#18181b",
        "surface-hover": "#222227",
        border: "#27272a",
        gold: {
          50: "#fbf8ee",
          100: "#f5eed3",
          200: "#ebdba8",
          300: "#dfc375",
          400: "#d4af37", // Canonical Gold
          500: "#b99225",
          600: "#98711c",
          700: "#765319",
          800: "#64441b",
          900: "#553a1c",
          950: "#321e0b",
        },
      },
    },
  },
  plugins: [],
};
export default config;
