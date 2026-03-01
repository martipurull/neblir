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
        sarpanch: ["Sarpanch", "sans-serif"],
        oxanium: ["Oxanium", "sans-serif"],
      },
      colors: {
        customPrimary: "#421161",
        customPrimaryHover: "#6D597A",
        customSecondary: "#F8ECFF",
        customSecondaryHover: "#F5F0F9",
        // Inventory weight pill: transparent bg, very subtle pale border + text
        neblirSafe: {
          200: "#bbf7d0",
          400: "#86efac",
          600: "#4ade80",
        },
        neblirWarning: {
          200: "#fde68a",
          400: "#fcd34d",
          600: "#eab308",
        },
        neblirDanger: {
          200: "#fecaca",
          400: "#fca5a5",
          600: "#f87171",
        },
      },
    },
  },
  plugins: [],
};
export default config;
