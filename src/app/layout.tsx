import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { cn } from "@/lib/utils";

const interHeading = Inter({subsets:['latin'],variable:'--font-heading'});

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

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", inter.variable, geistMono.variable, interHeading.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Analytics />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
