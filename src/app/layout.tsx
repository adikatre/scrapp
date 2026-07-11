import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { PillNav } from "@/components/PillNav";

import "./globals.css";

const fontFamily = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Scrapp",
  description: "Time to scrap the right way!"
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
      </body>
    </html>
  );
}
