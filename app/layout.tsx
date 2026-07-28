import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { SiteBackdrop } from "@/components/SiteBackdrop"
import { Sidebar } from "@/components/Sidebar"
import { ThemeProvider } from "@/components/ThemeProvider"
import { site } from "@/lib/site"

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
  // metadataBase turns the relative URLs below into absolute ones for OG/Twitter cards,
  // which crawlers require. Set NEXT_PUBLIC_SITE_URL in CI to the real origin.
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s — ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: "Junle (Juno) Zhou" }],
  creator: "Junle (Juno) Zhou",
  keywords: ["digital garden", "quant", "LLM inference", "vLLM", "C++", "systems", "EEG", "BCI"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: "/",
    title: site.title,
    description: site.description,
    images: [{ url: site.ogImage, width: 1200, height: 630, alt: site.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: [site.ogImage],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  // Matches the page backdrop per theme, so mobile browser chrome doesn't clash.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#cfd6f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e1a" },
  ],
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
        {/*
          Keyboard users land here first. The dashboard's sidebar is ~20 links deep, so
          without this every page starts with a long tab-through before the content.
          Off-screen until focused.
        */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:border focus:border-card-border focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:text-heading focus:backdrop-blur-glass"
        >
          Skip to content
        </a>
        <SiteBackdrop />
        <ThemeProvider>
          {/* One shell for every page: the sidebar is the only nav (no top bar), so it stays put
              as you move between Home, Roadmap, Blog, … */}
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
