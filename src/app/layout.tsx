import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Toaster } from "@/components/ui/sonner";
import { PillNav } from "@/components/PillNav";

import "./globals.css";

const fontFamily = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Scrapp",
  description: "Time to scrap the right way!",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Scrapp"
  }
};

export const viewport: Viewport = {
  themeColor: "#19573f"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="dark">
        <main className={`w-full ${fontFamily.className} antialiased`}>
          <Toaster />
          <PillNav />
          {children}
        </main>
        <Toaster richColors closeButton />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
