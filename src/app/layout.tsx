import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Puntrlytics | Understand your true betting performance",
  description: "Your betting site won't tell you if you're actually making money. Get instant insights into your true profit, ROI, and win-rate. 100% private, runs entirely in your browser.",
  openGraph: {
    title: "Puntrlytics | Understand your true betting performance",
    description: "Your betting site won't tell you if you're actually making money. Get instant insights into your true profit, ROI, and win-rate.",
    type: "website",
    locale: "en_US",
    siteName: "Puntrlytics",
    images: [{ url: '/og_image.png' }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Puntrlytics | Understand your true betting performance",
    description: "Get instant insights into your true betting profit, ROI, and win-rate. 100% private, runs entirely in your browser.",
    images: ['/og_image.png']
  },
  keywords: ["betting analyzer", "bet history", "profit tracker", "sports betting roi", "betting win rate calculator"],
  authors: [{ name: "Puntrlytics" }],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
