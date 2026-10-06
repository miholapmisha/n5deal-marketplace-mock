import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "N5Deal Marketplace",
    template: "%s | N5Deal Marketplace",
  },
  description: "Buy and sell licensed fintech businesses: banks, EMIs, payment institutions, and crypto companies.",
};

// The header reads the session cookie, so every route renders per request. Auth checks
// still live in pages and services: layouts do not re-render on client navigation.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
