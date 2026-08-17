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
      <footer className="">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-6 py-4 text-center sm:flex-row sm:text-left max-[520px]:px-4">
          <span className="font-display text-sm font-black uppercase tracking-wider text-gold">
            Puntrlytics
          </span>
          <p className="font-utility text-[11px] uppercase tracking-[1.2px] text-ink">
            Your data never leaves your device — no account, no upload
          </p>
          <span className="font-mono text-[11px] text-faint">
            © {new Date().getFullYear()} Puntrlytics
          </span>
        </div>
      </footer>
    </>
  );
}
