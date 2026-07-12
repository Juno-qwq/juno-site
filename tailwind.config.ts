import type { Config } from "tailwindcss"

/**
 * Tailwind maps to the CSS variables defined in styles/tokens.css (the canonical token
 * source, DESIGN.md §8). Dark mode is driven by `[data-theme="dark"]` on <html>, the same
 * attribute the pre-hydration script and ThemeProvider set from the shared `theme` key.
 */
const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        "card-border": "var(--card-border)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        heading: "var(--heading)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Cormorant Garamond", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "var(--radius-card)",
      },
      boxShadow: {
        glass: "var(--shadow-card)",
        glow: "0 0 40px var(--glow)",
      },
      backdropBlur: {
        glass: "14px",
      },
    },
  },
  plugins: [],
}

export default config
