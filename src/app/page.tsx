"use client";

import { useState } from "react";
import bookmarkletsData from "@/lib/bookmarklets-data.json";
import { HeroSection } from "@/components/home/HeroSection";
import { DemoPreview } from "@/components/home/DemoPreview";
import { DesktopSteps } from "@/components/home/DesktopSteps";
import { MobileSteps } from "@/components/home/MobileSteps";
import { InfoSection } from "@/components/home/InfoSection";
import { FeatureHighlights } from "@/components/home/FeatureHighlights";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [copied, setCopied] = useState(false);

  // Use the loader by default (if generated) for a short URL, otherwise fallback to auto
  const activeProvider = bookmarkletsData.bookmarklets.find((b) => b.id === "loader") || bookmarkletsData.bookmarklets.find((b) => b.id === "auto") || bookmarkletsData.bookmarklets[0];

  const handleCopy = () => {
    if (activeProvider && navigator.clipboard) {
      // Decode the URI-encoded URL so it looks like readable javascript: code when pasted, but KEEP the javascript: prefix!
      const decodedUrl = decodeURIComponent(activeProvider.url);
      navigator.clipboard.writeText(decodedUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between px-6 max-[520px]:px-4">
        <div className="font-display text-xl font-black uppercase tracking-wider text-gold">
          Puntrlytics
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button nativeButton={false} render={<Link href="/dashboard" />} variant="link" className="font-utility font-bold uppercase tracking-wider text-sm text-ink transition hover:text-cyan hover:no-underline px-0">
            Dashboard
          </Button>
        </div>
      </header>
      <main className="px-4 pt-4 leading-relaxed max-[520px]:px-3 max-[520px]:pb-6 max-[520px]:pt-2">
        <div className="container mx-auto">
          <div className="mb-6 pb-6">
            <HeroSection activeProviderUrl={activeProvider?.url || "#"} />
            <DemoPreview />
          </div>
          {/* 
          <FeatureHighlights /> */}

          <DesktopSteps />
          <MobileSteps copied={copied} onCopy={handleCopy} />
        </div>
      </main>
      <footer className="border-t border-rule mt-12">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-8 text-center md:flex-row md:text-left max-[520px]:px-4">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <span className="font-display text-sm font-black uppercase tracking-wider text-gold">
              Puntrlytics
            </span>
          </div>

          <div className="flex flex-col items-center gap-3 md:items-end">
            <div className="flex items-center gap-4 text-[11px] font-utility font-bold uppercase tracking-wider">
              <a href="https://x.com/mikeoxygen_" target="_blank" rel="noopener noreferrer" className="text-faint hover:text-cyan transition-colors focus-visible:outline focus-visible:outline-cyan rounded-sm">
                Built by @mikeoxygen_
              </a>
              <span className="text-rule">•</span>
              <a href="https://github.com/Blazing-Mike/puntrlytics" target="_blank" rel="noopener noreferrer" className="text-faint hover:text-cyan transition-colors focus-visible:outline focus-visible:outline-cyan rounded-sm">
                GitHub
              </a>
            </div>
            <span className="font-mono text-[10px] text-faint">
              © {new Date().getFullYear()} Puntrlytics
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
