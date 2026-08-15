import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
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
  title: "Betlytics | Understand your true betting performance",
  description: "Your betting site won't tell you if you're actually making money. Get instant insights into your true profit, ROI, and win-rate. 100% private, runs entirely in your browser.",
  openGraph: {
    title: "Betlytics | Understand your true betting performance",
    description: "Your betting site won't tell you if you're actually making money. Get instant insights into your true profit, ROI, and win-rate.",
    type: "website",
    locale: "en_US",
    siteName: "Betlytics",
  },
  twitter: {
    card: "summary_large_image",
    title: "Betlytics | Understand your true betting performance",
    description: "Get instant insights into your true betting profit, ROI, and win-rate. 100% private, runs entirely in your browser.",
  },
  keywords: ["betting analyzer", "bet history", "profit tracker", "sports betting roi", "betting win rate calculator"],
  authors: [{ name: "Betlytics" }],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
