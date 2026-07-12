import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"

// Self-hosted display serif + body sans (DESIGN.md §8), exposed as CSS variables.
const display = localFont({
  src: [
    { path: "./fonts/cormorant-garamond-600-latin.woff2", weight: "600", style: "normal" },
    { path: "./fonts/cormorant-garamond-700-latin.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
})

const sans = localFont({
  src: [
    { path: "./fonts/inter-400-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-500-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/inter-600-latin.woff2", weight: "600", style: "normal" },
    { path: "./fonts/inter-700-latin.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Juno — Digital Garden",
  description: "A digital garden for quant, AI, systems, and research by Junle (Juno) Zhou.",
}

// Runs before first paint: applies the saved theme (or OS preference) so there is NO flash
// of the wrong theme. Shares the `theme` key + `data-theme` attribute with the Quartz garden.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="site-backdrop" aria-hidden="true" />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
