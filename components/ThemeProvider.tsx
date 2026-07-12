"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

export type Theme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
  setTheme: () => {},
})

/**
 * Owns the shared theme contract (DESIGN.md §8): the `theme` localStorage key and the
 * `data-theme` attribute on <html> — identical to the Quartz garden, so one toggle governs
 * both surfaces on the same origin. The initial attribute is set pre-hydration by the inline
 * script in layout.tsx (no flash); this provider reads it back and handles updates.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")

  // Sync React state to the attribute the pre-hydration script already applied.
  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || "light"
    setThemeState(current)
    // Enable color transitions only AFTER first paint, so load itself never animates.
    const id = requestAnimationFrame(() =>
      document.documentElement.classList.add("theme-ready"),
    )
    return () => cancelAnimationFrame(id)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.setAttribute("data-theme", t)
    try {
      localStorage.setItem("theme", t)
    } catch {
      /* private mode / storage disabled — attribute still applies for this session */
    }
    setThemeState(t)
  }, [])

  const toggle = useCallback(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark")
  }, [setTheme])

  // Cross-surface / cross-tab sync: another tab (or the garden) writing `theme` updates us.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme" && (e.newValue === "light" || e.newValue === "dark")) {
        document.documentElement.setAttribute("data-theme", e.newValue)
        setThemeState(e.newValue)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  return <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
