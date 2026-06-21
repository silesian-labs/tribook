import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Obsidian base palette
        void: "#050507",
        obsidian: "#08090d",
        graphite: "#0e1016",
        slate: "#141822",
        hairline: "rgba(255,255,255,0.08)",
        // The three books
        spot: {
          DEFAULT: "#2DD4BF", // aqua / teal
          soft: "#5EEAD4",
          deep: "#0d9488",
        },
        margin: {
          DEFAULT: "#8B5CF6", // violet
          soft: "#A78BFA",
          deep: "#6d28d9",
        },
        predict: {
          DEFAULT: "#F5A524", // amber
          soft: "#FBBF24",
          deep: "#b45309",
        },
        // semantic
        up: "#34D399",
        down: "#FB7185",
      },
      fontFamily: {
        display: ["var(--font-display)", "Space Grotesk", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        eyebrow: "0.24em",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.75rem",
      },
      boxShadow: {
        // soft, diffuse ambient — never harsh
        ambient: "0 40px 120px -30px rgba(0,0,0,0.8)",
        glow: "0 0 80px -20px rgba(45,212,191,0.45)",
        "glow-violet": "0 0 80px -20px rgba(139,92,246,0.45)",
        "inner-hl": "inset 0 1px 1px rgba(255,255,255,0.12)",
      },
      transitionTimingFunction: {
        // Emil's strong curves
        "out-strong": "cubic-bezier(0.23, 1, 0.32, 1)",
        "in-out-strong": "cubic-bezier(0.77, 0, 0.175, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)", filter: "blur(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        "drift-a": {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(6%, -4%) scale(1.08)" },
        },
        "drift-b": {
          "0%, 100%": { transform: "translate(0,0) scale(1.05)" },
          "50%": { transform: "translate(-5%, 5%) scale(0.95)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s cubic-bezier(0.23,1,0.32,1) both",
        "drift-a": "drift-a 18s ease-in-out infinite",
        "drift-b": "drift-b 22s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.23,1,0.32,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
