import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#020817",
        card: "#020617",
        border: "#1e293b",
        accent: "#38bdf8"
      }
    }
  },
  plugins: []
};

export default config;
