import type { Metadata, Viewport } from "next";
import { Geist, Sora } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { PillNav } from "@/components/PillNav";
import { Toaster } from "@/components/ui/sonner";

import "@/app/globals.css";

const fontFamily = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const displayFamily = Sora({
  variable: "--font-sora",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Scrapp — Snap it. Sort it right.",
  description: "Photo-first disposal guidance and nearby drop-off options for San Diego.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Scrapp"
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#101817" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontFamily.variable} ${displayFamily.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <AppProviders>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <PillNav />
          <main id="main-content" className="w-full">
            {children}
          </main>
          <Toaster richColors closeButton position="bottom-center" />
        </AppProviders>
      </body>
    </html>
  );
}
