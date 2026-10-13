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
        customPrimary: "rgb(var(--theme-accent-rgb) / <alpha-value>)",
        customPrimaryHover: "#6D597A",
        customSecondary: "#F8ECFF",
        customSecondaryHover: "#F5F0F9",
        neblirSafe: {
          DEFAULT: "rgb(var(--theme-safe-600-rgb) / <alpha-value>)",
          200: "rgb(var(--theme-safe-200-rgb) / <alpha-value>)",
          400: "rgb(var(--theme-safe-400-rgb) / <alpha-value>)",
          600: "rgb(var(--theme-safe-600-rgb) / <alpha-value>)",
        },
        neblirWarning: {
          DEFAULT: "rgb(var(--theme-warning-600-rgb) / <alpha-value>)",
          200: "rgb(var(--theme-warning-200-rgb) / <alpha-value>)",
          400: "rgb(var(--theme-warning-400-rgb) / <alpha-value>)",
          600: "rgb(var(--theme-warning-600-rgb) / <alpha-value>)",
        },
        neblirDanger: {
          DEFAULT: "rgb(var(--theme-danger-600-rgb) / <alpha-value>)",
          200: "rgb(var(--theme-danger-200-rgb) / <alpha-value>)",
          400: "rgb(var(--theme-danger-400-rgb) / <alpha-value>)",
          600: "rgb(var(--theme-danger-600-rgb) / <alpha-value>)",
        },
        modalBackground: {
          DEFAULT: "rgb(var(--theme-modal-600-rgb) / <alpha-value>)",
          200: "rgb(var(--theme-modal-rgb) / <alpha-value>)",
          400: "rgb(var(--theme-modal-400-rgb) / <alpha-value>)",
          600: "rgb(var(--theme-modal-600-rgb) / <alpha-value>)",
        },
        paleBlue: {
          DEFAULT: "rgb(var(--theme-card-rgb) / <alpha-value>)",
          hover: "rgb(var(--theme-card-hover-rgb) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
