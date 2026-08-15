"use client";

import { useState } from "react";
import bookmarkletsData from "@/lib/bookmarklets-data.json";
import { HeroSection } from "@/components/home/HeroSection";
import { DemoPreview } from "@/components/home/DemoPreview";
import { DesktopSteps } from "@/components/home/DesktopSteps";
import { MobileSteps } from "@/components/home/MobileSteps";
import { InfoSection } from "@/components/home/InfoSection";

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
    <main className="px-[18px] pt-[30px] leading-relaxed max-[520px]:px-3 max-[520px]:pb-11 max-[520px]:pt-5">
      <div className="container mx-auto">
        <div className="mb-[18px] pb-4">
          <HeroSection activeProviderUrl={activeProvider?.url || "#"} />
          <DemoPreview />
        </div>

        <DesktopSteps />
        <MobileSteps copied={copied} onCopy={handleCopy} />
        <InfoSection 
          copied={copied} 
          onCopy={handleCopy} 
          activeProviderCode={activeProvider?.code || ""} 
        />
      </div>
    </main>
  );
}
