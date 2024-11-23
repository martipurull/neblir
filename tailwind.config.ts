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
        sarpanch: ['Sarpanch', 'sans-serif'],
        oxanium: ['Oxanium', 'sans-serif'],
      },
    },
    colors: {
      customPrimary: '#421161',
      customPrimaryHover: '#6D597A',
      customSecondary: '#F8ECFF',
      customSecondaryHover: '#F5F0F9',
    },
  },
  plugins: [],
};
export default config;
